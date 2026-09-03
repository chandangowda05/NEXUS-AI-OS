/**
 * NEXUS AI OS — Application Bootstrap Module
 *
 * Separates critical startup services (StartupGuard) from non-critical background services (BackgroundTaskManager).
 * Critical services initialize before UI appears; background services initialize after SplashScreen finishes.
 */

import { StartupGuard } from './services/StartupGuard';
import { voiceService } from './services/voiceService';
import { BackgroundTaskManager } from './services/BackgroundTaskManager';
import { checkConnection } from './services/supabaseService';

/**
 * Register all critical core startup services with StartupGuard exactly once.
 */
export function registerStartupServices(): void {
  StartupGuard.register(voiceService);
}

/**
 * Register all non-critical background services with BackgroundTaskManager.
 * Future services (Database, Memory, AI, Metrics, Plugins) will be registered here.
 */
export function registerBackgroundServices(): void {
  // Existing non-critical background tasks will be registered here.
  // Supports zero tasks natively without errors or warnings.
}

/**
 * Perform critical application startup bootstrap sequence.
 */
export async function bootstrapApp(): Promise<void> {
  registerStartupServices();
  await StartupGuard.initialize();
}

/**
 * Trigger lazy background service initialization after SplashScreen completes.
 */
export async function startBackgroundServices(): Promise<void> {
  registerBackgroundServices();
  await BackgroundTaskManager.start();

  // Verify Supabase backend connectivity (non-blocking)
  checkConnection().then((connected) => {
    if (connected) {
      console.log('[NEXUS/Bootstrap] Supabase backend connected — cloud persistence active.');
    } else {
      console.warn('[NEXUS/Bootstrap] Supabase not connected — running in offline/local mode.');
    }
  });
}

export default bootstrapApp;

