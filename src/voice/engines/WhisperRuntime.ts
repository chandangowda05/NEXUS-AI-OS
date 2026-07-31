/**
 * NEXUS AI OS — WhisperRuntime Implementation
 *
 * Manages the underlying Whisper speech runtime lifecycle, session initialization,
 * model validation, and resource cleanup. Exposes clear runtime statuses:
 * 'uninitialized' | 'loading' | 'ready' | 'failed'
 */

import { modelManager, ModelInfo } from '../models/ModelManager';

export type RuntimeStatus = 'uninitialized' | 'loading' | 'ready' | 'failed';

export interface WhisperSession {
  modelId: string;
  version: string;
  cacheDir: string;
  initializedAt: number;
}

export class WhisperRuntime {
  private status: RuntimeStatus = 'uninitialized';
  private currentModelId: string | null = null;
  private session: WhisperSession | null = null;

  /**
   * Current runtime status getter
   */
  public getStatus(): RuntimeStatus {
    return this.status;
  }

  /**
   * Active loaded model ID getter
   */
  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  /**
   * Active session handle getter
   */
  public getSession(): WhisperSession | null {
    return this.session;
  }

  /**
   * Initializes the Whisper runtime and loads the specified model
   */
  public async initialize(modelId: string): Promise<void> {
    console.log('[NEXUS/WhisperEngine] Runtime initializing');
    this.status = 'loading';
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // Validate model metadata via ModelManager
      const validation = modelManager.validateModel(modelId);
      if (!validation.valid || !validation.model) {
        throw new Error(validation.error || `Model validation failed for "${modelId}"`);
      }

      const model = validation.model;
      console.log(`[NEXUS/WhisperEngine] Loading model ${model.id}`);

      // Initialize session handle
      this.session = {
        modelId: model.id,
        version: model.version,
        cacheDir: model.cacheDir,
        initializedAt: Date.now(),
      };

      this.currentModelId = model.id;
      this.status = 'ready';
      console.log('[NEXUS/WhisperEngine] Runtime ready');
    } catch (err: any) {
      this.status = 'failed';
      this.session = null;
      this.currentModelId = null;
      console.error(`[NEXUS/WhisperEngine] Runtime initialization failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Dispose runtime and cleanup loaded session
   */
  public async dispose(): Promise<void> {
    this.session = null;
    this.currentModelId = null;
    this.status = 'uninitialized';
    console.log('[NEXUS/WhisperEngine] Runtime disposed');
  }

  /**
   * Helper checking if runtime is ready
   */
  public isReady(): boolean {
    return this.status === 'ready';
  }
}
