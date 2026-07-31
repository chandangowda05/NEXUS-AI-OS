/**
 * NEXUS AI OS — WhisperRuntime Implementation (@huggingface/transformers backend)
 *
 * Manages Hugging Face Transformers Whisper pipeline initialization, model caching,
 * inference abstraction, and resource cleanup.
 */

import { pipeline, env } from '@huggingface/transformers';
import { modelManager, ModelInfo } from '../models/ModelManager';

export type RuntimeStatus = 'uninitialized' | 'loading' | 'ready' | 'failed';

export interface WhisperSession {
  modelId: string;
  version: string;
  cacheDir: string;
  pipelineInstance: any;
  initializedAt: number;
}

export type PipelineLoader = (
  task: string,
  model?: string,
  options?: any
) => Promise<any>;

export class WhisperRuntime {
  private static defaultPipelineLoader: PipelineLoader | null = null;

  private status: RuntimeStatus = 'uninitialized';
  private currentModelId: string | null = null;
  private session: WhisperSession | null = null;
  private pipelineLoader: PipelineLoader;

  public static setDefaultPipelineLoader(loader: PipelineLoader | null): void {
    WhisperRuntime.defaultPipelineLoader = loader;
  }

  constructor(customPipelineLoader?: PipelineLoader) {
    this.pipelineLoader =
      customPipelineLoader ||
      WhisperRuntime.defaultPipelineLoader ||
      (pipeline as unknown as PipelineLoader);
  }

  /**
   * Returns current runtime status
   */
  public getStatus(): RuntimeStatus {
    return this.status;
  }

  /**
   * Returns active model ID
   */
  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  /**
   * Returns active session object
   */
  public getSession(): WhisperSession | null {
    return this.session;
  }

  /**
   * Initializes the Transformers runtime and loads the specified Whisper model
   */
  public async initialize(modelId: string = 'whisper-tiny.en'): Promise<void> {
    // Model Caching: Re-use instance if already initialized with the exact same model ID
    if (this.status === 'ready' && this.currentModelId === modelId && this.session?.pipelineInstance) {
      console.log(`[NEXUS/WhisperRuntime] Model ${modelId} already loaded and cached. Reusing instance.`);
      return;
    }

    console.log('[NEXUS/WhisperRuntime] Loading transformers runtime');
    this.status = 'loading';
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // Validate model metadata via ModelManager
      const validation = modelManager.validateModel(modelId);
      if (!validation.valid || !validation.model) {
        throw new Error(validation.error || `Model validation failed for "${modelId}"`);
      }

      const model = validation.model;
      console.log(`[NEXUS/WhisperRuntime] Loading ${model.id}`);

      // Allow remote HuggingFace models
      if (env) {
        env.allowRemoteModels = true;
      }

      // Extract HuggingFace repo path from model URL or fallback to default ONNX model repo
      const hfModelName = model.url
        ? model.url.replace('https://huggingface.co/', '')
        : 'onnx-community/whisper-tiny.en';

      let pipe: any = null;
      if (this.pipelineLoader) {
        pipe = await this.pipelineLoader('automatic-speech-recognition', hfModelName, {
          quantized: true,
        });
      }

      console.log('[NEXUS/WhisperRuntime] Model initialized');

      this.session = {
        modelId: model.id,
        version: model.version,
        cacheDir: model.cacheDir,
        pipelineInstance: pipe,
        initializedAt: Date.now(),
      };

      this.currentModelId = model.id;
      this.status = 'ready';
      console.log('[NEXUS/WhisperRuntime] Runtime ready');
    } catch (err: any) {
      this.status = 'failed';
      this.session = null;
      this.currentModelId = null;
      console.error(`[NEXUS/WhisperRuntime] Runtime initialization failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Explicit model loader interface
   */
  public async loadModel(modelId: string = 'whisper-tiny.en'): Promise<void> {
    await this.initialize(modelId);
  }

  /**
   * Transcribe PCM audio data using the loaded pipeline
   */
  public async transcribe(audio: Float32Array | number[]): Promise<{ text: string }> {
    if (this.status !== 'ready' || !this.session?.pipelineInstance) {
      throw new Error('WhisperRuntime is not ready for transcription.');
    }
    const result = await this.session.pipelineInstance(audio);
    return {
      text: typeof result === 'string' ? result : (result?.text || ''),
    };
  }

  /**
   * Dispose runtime and cleanup loaded pipeline session
   */
  public async dispose(): Promise<void> {
    if (this.session?.pipelineInstance && typeof this.session.pipelineInstance.dispose === 'function') {
      try {
        await this.session.pipelineInstance.dispose();
      } catch (err) {
        // Ignore internal disposal errors
      }
    }

    this.session = null;
    this.currentModelId = null;
    this.status = 'uninitialized';
    console.log('[NEXUS/WhisperRuntime] Runtime disposed');
  }

  /**
   * Helper checking if runtime is ready
   */
  public isReady(): boolean {
    return this.status === 'ready';
  }
}
