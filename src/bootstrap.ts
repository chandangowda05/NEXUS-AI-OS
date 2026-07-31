/**
 * NEXUS AI OS — Application Bootstrap Module
 *
 * Registers all core startup services with StartupGuard outside React component lifecycle.
 * Future core services (Database, Memory, AI, Metrics, Plugins) can be registered here.
 */

import { StartupGuard } from './services/StartupGuard';
import { voiceService } from './services/voiceService';

/**
 * Register all core startup services with StartupGuard exactly once.
 */
export function registerStartupServices(): void {
  StartupGuard.register(voiceService);
}

/**
 * Perform full application bootstrap lifecycle sequence.
 */
export async function bootstrapApp(): Promise<void> {
  registerStartupServices();
  await StartupGuard.initialize();
}

export default bootstrapApp;
