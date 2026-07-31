/**
 * NEXUS AI OS — BackgroundTaskManager & Lazy Initialization Manager
 *
 * Manages non-critical background service initialization after main UI becomes interactive.
 * Features deduplication, idempotent start(), progress reporting via BackgroundState,
 * event loop yielding (60 FPS responsiveness), failure isolation, and zero-task safety.
 */

import { BackgroundState } from './BackgroundState';

export interface IBackgroundTask {
  name: string;
  taskLabel?: string;
  priority?: number;
  dependencies?: string[];
  initialize(): Promise<void>;
}

export class BackgroundTaskManager {
  private static started = false;
  private static completed = false;
  private static tasks: IBackgroundTask[] = [];

  /**
   * Register a non-critical background task.
   * Duplicate registrations by name are safely ignored.
   * Metadata (priority, dependencies) is stored for future compatibility.
   */
  public static registerTask(task: IBackgroundTask): void {
    if (!task || !task.name) return;
    if (this.tasks.some((t) => t.name === task.name)) {
      return;
    }
    this.tasks.push(task);
  }

  /**
   * Unregister a task by name.
   */
  public static unregisterTask(name: string): void {
    this.tasks = this.tasks.filter((t) => t.name !== name);
  }

  /**
   * Get list of registered background tasks (read-only).
   */
  public static getRegisteredTasks(): readonly IBackgroundTask[] {
    return [...this.tasks];
  }

  /**
   * Yield control back to the JavaScript event loop to ensure UI remains responsive.
   */
  private static async yieldToEventLoop(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  /**
   * Execute background initialization sequence idempotently.
   * Will return immediately if already started or completed.
   */
  public static async start(): Promise<void> {
    if (this.started || this.completed) {
      return;
    }
    this.started = true;

    console.log('[NEXUS] Background initialization started');
    BackgroundState.initTasks(
      this.tasks.map((t) => ({ name: t.name, taskLabel: t.taskLabel || `Loading ${t.name}...` }))
    );
    BackgroundState.markStarted();

    if (this.tasks.length === 0) {
      this.completed = true;
      BackgroundState.markComplete();
      console.log('[NEXUS] Background initialization complete');
      return;
    }

    for (const task of this.tasks) {
      console.log(`[NEXUS] Starting ${task.name}`);
      BackgroundState.updateTaskStatus(task.name, 'running', undefined, task.taskLabel || task.name);

      await this.yieldToEventLoop();

      try {
        await task.initialize();
        BackgroundState.updateTaskStatus(task.name, 'completed', undefined, task.taskLabel || task.name);
        console.log(`[NEXUS] ${task.name} Ready`);
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        console.error(`[NEXUS] ${task.name} initialization failed:`, err);
        console.log('Continuing background initialization...');
        BackgroundState.updateTaskStatus(task.name, 'failed', errorMsg, task.taskLabel || task.name);
      }

      await this.yieldToEventLoop();
    }

    this.completed = true;
    BackgroundState.markComplete();
    console.log('[NEXUS] Background initialization complete');
  }

  /**
   * Reset internal execution state for unit testing.
   */
  public static resetForTest(): void {
    this.started = false;
    this.completed = false;
    this.tasks = [];
    BackgroundState.resetForTest();
  }
}

export default BackgroundTaskManager;
