/**
 * NEXUS AI OS — WhisperEngine Implementation
 *
 * Implements IElectronSpeechEngine using offline Whisper STT runtime architecture.
 * Manages model metadata loading, stream lifecycle, PCM buffering & concatenation,
 * runtime inference, state machine (idle -> listening -> processing -> idle), and error handling.
 * Preserves standard speech engine contract for Electron Desktop environment.
 */

import { IElectronSpeechEngine, EngineCallbacks } from './IElectronSpeechEngine';
import { VoiceState } from '../../types/voice';
import { modelManager, ModelInfo } from '../models/ModelManager';
import { WhisperRuntime, RuntimeStatus } from './WhisperRuntime';

import { StartupState } from '../../services/StartupState';

export class WhisperEngine implements IElectronSpeechEngine {
  public readonly name = 'WhisperEngine';

  private state: VoiceState = 'idle';
  private callbacks: EngineCallbacks | null = null;
  private pcmBuffer: Float32Array[] = [];
  private activeModel: ModelInfo | undefined = undefined;
  private runtime: WhisperRuntime;
  private initialized = false;

  constructor(runtime?: WhisperRuntime) {
    this.runtime = runtime || new WhisperRuntime();
  }

  /**
   * Initialize engine: loads active model metadata & initializes Whisper runtime
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    console.log('[NEXUS] Loading Whisper');
    StartupState.updateProgress(60, 'Loading Whisper STT Engine...');
    console.log('[NEXUS] Whisper initialized');
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
   * Start streaming session, clearing previous PCM buffer and entering listening state
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
    if (!chunk || !(chunk instanceof Float32Array) || chunk.length === 0) {
      console.warn('[NEXUS/WhisperEngine] Received invalid or empty Float32Array PCM chunk.');
      return;
    }
    this.pcmBuffer.push(chunk);
    console.log(`[NEXUS/WhisperEngine] writePCM() | buffered chunk of ${chunk.length} samples (total chunks: ${this.pcmBuffer.length})`);
  }

  /**
   * Stop active streaming session, process accumulated PCM audio, invoke Whisper inference, and emit final transcript
   */
  public async stopStream(): Promise<void> {
    console.log('[NEXUS/WhisperEngine] Recording stopped');
    if (this.state !== 'listening') {
      return;
    }

    this.setState('processing');
    console.log('[NEXUS/WhisperEngine] Processing audio');

    try {
      const concatenatedPCM = this.getConcatenatedPCM();

      // Validation: empty audio buffer or 0 samples
      if (!concatenatedPCM || concatenatedPCM.length === 0) {
        throw new Error('Empty audio buffer: no PCM audio data was recorded.');
      }

      if (!this.runtime.isReady()) {
        throw new Error('Whisper runtime is not initialized or ready for inference.');
      }

      const result = await this.runtime.transcribe(concatenatedPCM);

      if (this.callbacks) {
        this.callbacks.onTranscript(result.text, true);
        console.log('[NEXUS/WhisperEngine] Transcript emitted');
      }

      this.setState('idle');
    } catch (err: any) {
      console.error(`[NEXUS/WhisperEngine] Transcription processing failed: ${err.message}`);
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError(`Transcription failed: ${err.message}`, 'transcription_failed');
      }
    } finally {
      this.pcmBuffer = [];
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
    if (this.state === 'listening') {
      await this.stopStream();
    }
    await this.runtime.dispose();
    this.pcmBuffer = [];
    this.callbacks = null;
    this.initialized = false;
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
   * Getter for buffered PCM chunks
   */
  public getBufferedChunks(): Float32Array[] {
    return this.pcmBuffer;
  }

  /**
   * Helper concatenating all Float32Array chunks in pcmBuffer into a single Float32Array
   */
  public getConcatenatedPCM(): Float32Array {
    const totalLength = this.pcmBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.pcmBuffer) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
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
