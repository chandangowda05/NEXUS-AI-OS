/**
 * NEXUS AI OS — BackgroundState & Reactive Background Progress Manager
 *
 * Tracks background initialization lifecycle, progress percentage, task statuses,
 * and completion metrics without forcing full App re-renders.
 */

import { useState, useEffect } from 'react';

export type BackgroundTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackgroundTaskItem {
  name: string;
  taskLabel: string;
  status: BackgroundTaskStatus;
  error?: string;
}

export interface BackgroundProgressState {
  isStarted: boolean;
  isComplete: boolean;
  progress: number; // 0 to 100
  currentTask: string;
  completedTasks: string[];
  failedTasks: string[];
  tasks: BackgroundTaskItem[];
}

type BackgroundStateListener = (state: BackgroundProgressState) => void;

class BackgroundStateManager {
  private state: BackgroundProgressState = {
    isStarted: false,
    isComplete: false,
    progress: 0,
    currentTask: '',
    completedTasks: [],
    failedTasks: [],
    tasks: [],
  };

  private listeners: Set<BackgroundStateListener> = new Set();

  public getState(): BackgroundProgressState {
    return {
      ...this.state,
      completedTasks: [...this.state.completedTasks],
      failedTasks: [...this.state.failedTasks],
      tasks: this.state.tasks.map((t) => ({ ...t })),
    };
  }

  public subscribe(listener: BackgroundStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Set initial tasks list before starting execution.
   */
  public initTasks(tasks: { name: string; taskLabel?: string }[]): void {
    const taskItems: BackgroundTaskItem[] = tasks.map((t) => ({
      name: t.name,
      taskLabel: t.taskLabel || t.name,
      status: 'pending',
    }));

    this.state = {
      ...this.state,
      tasks: taskItems,
      progress: tasks.length === 0 ? 100 : 0,
      isComplete: tasks.length === 0,
    };
    this.notify();
  }

  /**
   * Mark background initialization as started.
   */
  public markStarted(): void {
    this.state = {
      ...this.state,
      isStarted: true,
    };
    this.notify();
  }

  /**
   * Update task status (pending -> running -> completed / failed).
   * Calculates progress strictly based on successfully completed tasks.
   * Failed tasks do NOT increase progress percentage.
   */
  public updateTaskStatus(
    name: string,
    status: BackgroundTaskStatus,
    error?: string,
    currentTaskLabel?: string
  ): void {
    const totalCount = this.state.tasks.length;
    let completedCount = 0;
    const completedTasks: string[] = [];
    const failedTasks: string[] = [];

    const updatedTasks = this.state.tasks.map((t) => {
      if (t.name === name) {
        const nextStatus = status;
        const item = { ...t, status: nextStatus, error: error || t.error };
        if (nextStatus === 'completed') {
          completedCount++;
          completedTasks.push(t.name);
        } else if (nextStatus === 'failed') {
          failedTasks.push(t.name);
        }
        return item;
      }
      if (t.status === 'completed') {
        completedCount++;
        completedTasks.push(t.name);
      } else if (t.status === 'failed') {
        failedTasks.push(t.name);
      }
      return t;
    });

    const computedProgress = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);
    const newProgress = Math.max(this.state.progress, Math.min(100, computedProgress));

    this.state = {
      ...this.state,
      tasks: updatedTasks,
      progress: newProgress,
      currentTask: currentTaskLabel || this.state.currentTask,
      completedTasks,
      failedTasks,
    };
    this.notify();
  }

  /**
   * Mark background initialization complete.
   * Progress reflects percentage of successfully completed tasks (100% if 0 tasks registered).
   */
  public markComplete(): void {
    const totalCount = this.state.tasks.length;
    const completedCount = this.state.completedTasks.length;
    const computedProgress = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);

    this.state = {
      ...this.state,
      isStarted: true,
      isComplete: true,
      progress: computedProgress,
      currentTask: 'Background Ready',
    };
    this.notify();
  }

  /**
   * Reset state for unit testing.
   */
  public resetForTest(): void {
    this.state = {
      isStarted: false,
      isComplete: false,
      progress: 0,
      currentTask: '',
      completedTasks: [],
      failedTasks: [],
      tasks: [],
    };
    this.listeners.clear();
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}

export const BackgroundState = new BackgroundStateManager();

/**
 * Custom React hook for observing BackgroundState reactively.
 */
export function useBackgroundState(): BackgroundProgressState {
  const [state, setState] = useState<BackgroundProgressState>(() => BackgroundState.getState());

  useEffect(() => {
    return BackgroundState.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return state;
}

export default BackgroundState;
