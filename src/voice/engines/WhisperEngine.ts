/**
 * NEXUS AI OS — WhisperEngine Implementation
 *
 * Implements IElectronSpeechEngine using offline Whisper STT runtime architecture.
 * Manages model metadata loading, stream lifecycle, PCM buffering, runtime initialization, and cleanup.
 * Preserves standard speech engine contract for Electron Desktop environment.
 */

import { IElectronSpeechEngine, EngineCallbacks } from './IElectronSpeechEngine';
import { VoiceState } from '../../types/voice';
import { modelManager, ModelInfo } from '../models/ModelManager';
import { WhisperRuntime, RuntimeStatus } from './WhisperRuntime';

export class WhisperEngine implements IElectronSpeechEngine {
  public readonly name = 'WhisperEngine';

  private state: VoiceState = 'idle';
  private callbacks: EngineCallbacks | null = null;
  private pcmBuffer: Float32Array[] = [];
  private activeModel: ModelInfo | undefined = undefined;
  private runtime: WhisperRuntime;

  constructor(runtime?: WhisperRuntime) {
    this.runtime = runtime || new WhisperRuntime();
  }

  /**
   * Initialize engine: loads active model metadata & initializes Whisper runtime
   */
  public async initialize(): Promise<void> {
    console.log('[NEXUS/WhisperEngine] initialize()');
    this.activeModel = modelManager.getActiveModel();
    const modelId = this.activeModel?.id || 'whisper-tiny.en';

    try {
      await this.runtime.initialize(modelId);
      this.setState('idle');
    } catch (err: any) {
      console.error(`[NEXUS/WhisperEngine] Initialization error: ${err.message}`);
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError(`Whisper runtime initialization failed: ${err.message}`, 'runtime_init_failed');
      }
    }
  }

  /**
   * Start streaming session, resetting PCM buffer and entering listening state
   */
  public async startStream(lang?: string): Promise<void> {
    console.log(`[NEXUS/WhisperEngine] startStream() | lang: ${lang || 'default'}`);
    this.pcmBuffer = [];
    this.setState('listening');
  }

  /**
   * Write Float32 mono PCM chunk into memory buffer
   */
  public writePCM(chunk: Float32Array): void {
    if (this.state !== 'listening') return;
    this.pcmBuffer.push(chunk);
    console.log(`[NEXUS/WhisperEngine] writePCM() | buffered chunk of ${chunk.length} samples (total chunks: ${this.pcmBuffer.length})`);
  }

  /**
   * Stop active streaming session and return to idle state
   */
  public async stopStream(): Promise<void> {
    console.log('[NEXUS/WhisperEngine] stopStream()');
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  /**
   * Register event callbacks for transcripts, errors, and state changes
   */
  public setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Returns whether WhisperEngine is supported in current environment
   */
  public isSupported(): boolean {
    return true;
  }

  /**
   * Full cleanup of engine resources, runtime instance, and buffered PCM data
   */
  public async dispose(): Promise<void> {
    console.log('[NEXUS/WhisperEngine] dispose()');
    await this.stopStream();
    await this.runtime.dispose();
    this.pcmBuffer = [];
    this.callbacks = null;
    this.setState('idle');
  }

  /**
   * Retrieve current Whisper runtime status
   */
  public getRuntimeStatus(): RuntimeStatus {
    return this.runtime.getStatus();
  }

  /**
   * Retrieve underlying Whisper runtime instance
   */
  public getRuntime(): WhisperRuntime {
    return this.runtime;
  }

  /**
   * Getter for buffered PCM chunks (internal/testing utility)
   */
  public getBufferedChunks(): Float32Array[] {
    return this.pcmBuffer;
  }

  /**
   * Retrieve current voice state
   */
  public getState(): VoiceState {
    return this.state;
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    if (this.callbacks) {
      this.callbacks.onStateChange(newState);
    }
  }
}
