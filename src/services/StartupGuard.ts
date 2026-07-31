/**
 * NEXUS AI OS — StartupGuard & Deterministic Bootstrap Pipeline
 *
 * Guarantees singleton application initialization, deterministic service ordering,
 * timing performance logging, duplicate registration protection, and progress reporting.
 */

import { Sound } from '../utils/soundEffects';
import { StartupState } from './StartupState';

export interface IStartupService {
  name: string;
  taskLabel?: string;
  initialize(): Promise<void>;
}

export class StartupGuard {
  private static initialized = false;
  private static services: IStartupService[] = [];

  /**
   * Register a core or future service (Database, Memory, AI, Metrics, Plugins) into the startup pipeline.
   * Duplicate registrations are safely ignored.
   */
  public static register(service: IStartupService): void {
    if (!service || !service.name) return;
    if (this.services.some((s) => s.name === service.name)) {
      return;
    }
    this.services.push(service);
  }

  /**
   * Return list of registered services (read-only)
   */
  public static getRegisteredServices(): readonly IStartupService[] {
    return [...this.services];
  }

  /**
   * Execute deterministic startup pipeline exactly once.
   */
  public static async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    console.log('[NEXUS] Startup initialized');
    console.log('[NEXUS] Splash screen shown');

    StartupState.updateProgress(0, 'Initializing NEXUS...');
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const total = this.services.length;

    for (let i = 0; i < total; i++) {
      const service = this.services[i];
      const stepProgress = Math.round((i / Math.max(1, total)) * 100);
      const label = service.taskLabel || `Loading ${service.name}...`;

      console.log(`[NEXUS] Loading ${service.name}`);
      StartupState.updateProgress(stepProgress, label);

      try {
        await service.initialize();
      } catch (err: any) {
        console.error(`[NEXUS] Error initializing service ${service.name}:`, err);
      }
    }

    // Trigger startup sound playback (guarded by SoundSynthesizer singleton guard)
    Sound.playStartup();

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = Math.round(endTime - startTime);

    console.log(`[NEXUS] Startup complete (${duration} ms)`);
    StartupState.markComplete(duration);
  }

  /**
   * Reset internal guard state for testing environment reset.
   */
  public static resetForTest(): void {
    this.initialized = false;
    this.services = [];
  }
}

export default StartupGuard;
