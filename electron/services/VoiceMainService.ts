/**
 * NEXUS AI OS — Official Node.js Vosk Voice Main Service
 * 
 * Manages official Node.js 'vosk' speech engine in Electron Main Process.
 * Reuses singleton vosk.Model instance across sessions, creates & frees session-scoped
 * vosk.Recognizer instances, validates 16kHz mono PCM formats, batches 20-40ms chunks,
 * deduplicates partial results, and streams real transcripts over Electron IPC.
 */

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { modelManager } from '../../src/voice/models/ModelManager';

export type VoiceMainState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceTranscriptPayload {
  text: string;
  isFinal: boolean;
}

export interface VoiceErrorPayload {
  message: string;
  code?: string;
}

export class VoiceMainService {
  private static instance: VoiceMainService;

  private state: VoiceMainState = 'idle';
  private targetWindow: BrowserWindow | null = null;

  // Native Vosk instances (loaded via official 'vosk' Node module)
  private voskModule: any = null;
  private model: any = null;
  private recognizer: any = null;

  // Audio buffering & deduplication state
  private pcmAccumulator: number[] = [];
  private readonly targetBatchBytes = 1280; // ~40ms at 16kHz Int16 LE mono (640 samples * 2 bytes)
  private lastPartialText = '';
  private isSessionActive = false;

  private constructor() {
    this.tryLoadVoskModule();
  }

  public static getInstance(): VoiceMainService {
    if (!VoiceMainService.instance) {
      VoiceMainService.instance = new VoiceMainService();
    }
    return VoiceMainService.instance;
  }

  public setTargetWindow(window: BrowserWindow | null): void {
    this.targetWindow = window;
  }

  /**
   * Attempt loading official Node.js 'vosk' module
   */
  private tryLoadVoskModule(): boolean {
    if (this.voskModule) return true;
    try {
      // Dynamic require of official Node.js 'vosk' module
      this.voskModule = require('vosk');
      const version = this.voskModule.version || '0.3.39';
      console.log(`[VoiceMainService] Official Vosk Node module loaded successfully | Version: ${version}`);
      return true;
    } catch (err: any) {
      console.warn('[VoiceMainService] Official Node.js "vosk" package not yet installed/compiled:', err.message);
      return false;
    }
  }

  /**
   * Initialize or reuse vosk.Model instance from ModelManager path
   */
  private async ensureModelLoaded(): Promise<boolean> {
    if (this.model) return true;

    if (!this.tryLoadVoskModule()) {
      const errMessage = 'Official "vosk" Node package is not available. Please ensure Python & C++ build tools are installed and run "npm install vosk".';
      console.error(`[VoiceMainService] ${errMessage}`);
      this.notifyError(errMessage, 'module-missing');
      this.setState('error');
      return false;
    }

    const activeModelInfo = modelManager.getActiveModel();
    if (!activeModelInfo) {
      const errMessage = 'No active model info configured in ModelManager.';
      console.error(`[VoiceMainService] ${errMessage}`);
      this.notifyError(errMessage, 'model-not-found');
      this.setState('error');
      return false;
    }

    const relativePath = modelManager.getModelPath(activeModelInfo.id);
    const absoluteModelPath = path.resolve(process.cwd(), relativePath);

    console.log(`[VoiceMainService] Loading Vosk model from path: "${absoluteModelPath}"`);

    try {
      if (this.voskModule.setLogLevel) {
        this.voskModule.setLogLevel(-1); // Suppress debug noise
      }
      this.model = new this.voskModule.Model(absoluteModelPath);
      console.log(`[VoiceMainService] Vosk model successfully loaded and cached | Path: "${absoluteModelPath}"`);
      return true;
    } catch (err: any) {
      const errMessage = `Failed to load Vosk model at "${absoluteModelPath}": ${err.message}`;
      console.error(`[VoiceMainService] ${errMessage}`);
      this.notifyError(errMessage, 'model-load-failed');
      this.setState('error');
      return false;
    }
  }

  /**
   * Start speech recognition session
   */
  public async startSession(lang?: string): Promise<boolean> {
    console.log(`[VoiceMainService] startSession requested | lang: ${lang || 'default'} | current state: ${this.state}`);

    const modelReady = await this.ensureModelLoaded();
    if (!modelReady || !this.model) {
      return false;
    }

    try {
      // Clean up previous recognizer if exists
      this.freeRecognizer();

      const sampleRate = 16000;
      this.recognizer = new this.voskModule.Recognizer({
        model: this.model,
        sampleRate: sampleRate,
      });

      if (this.recognizer.setWords) {
        this.recognizer.setWords(true);
      }

      this.pcmAccumulator = [];
      this.lastPartialText = '';
      this.isSessionActive = true;
      this.setState('listening');

      console.log(`[VoiceMainService] Recognizer initialized | Vosk Version: ${this.voskModule.version || '0.3.39'} | Sample Rate: ${sampleRate} Hz | Mono: true`);
      return true;
    } catch (err: any) {
      const errMessage = `Recognizer initialization failure: ${err.message}`;
      console.error(`[VoiceMainService] ${errMessage}`);
      this.notifyError(errMessage, 'recognizer-init-failed');
      this.setState('error');
      return false;
    }
  }

  /**
   * Process incoming PCM audio chunk buffer (Float32 / ArrayBuffer)
   */
  public handleAudioChunk(
    buffer: ArrayBuffer | Uint8Array | Float32Array,
    sampleRate = 16000,
    channels = 1
  ): void {
    if (!this.isSessionActive || !this.recognizer || this.state !== 'listening') {
      return;
    }

    // 1. Audio format validation
    if (sampleRate !== 16000 || channels !== 1) {
      console.warn(`[VoiceMainService] Format warning: Rejected unsupported audio format (${sampleRate}Hz, ${channels} ch). Required: 16000Hz mono.`);
      return;
    }

    try {
      // 2. Convert Float32 PCM samples to 16-bit Int16 LE PCM bytes
      let floatData: Float32Array;
      if (buffer instanceof Float32Array) {
        floatData = buffer;
      } else if (buffer instanceof ArrayBuffer) {
        floatData = new Float32Array(buffer);
      } else {
        floatData = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
      }

      // Convert Float32 -> Int16 LE bytes and accumulate
      for (let i = 0; i < floatData.length; i++) {
        const s = Math.max(-1, Math.min(1, floatData[i]));
        const int16Val = s < 0 ? s * 0x8000 : s * 0x7fff;
        this.pcmAccumulator.push(int16Val & 0xff);
        this.pcmAccumulator.push((int16Val >> 8) & 0xff);
      }

      // 3. Process accumulated 20-40ms batch chunk
      if (this.pcmAccumulator.length >= this.targetBatchBytes) {
        const batchBuffer = Buffer.from(this.pcmAccumulator);
        this.pcmAccumulator = [];

        const isFinal = this.recognizer.acceptWaveform(batchBuffer);
        if (isFinal) {
          const rawResult = this.recognizer.result();
          const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
          const text = parsed?.text ? parsed.text.trim() : '';
          if (text) {
            console.log(`[VoiceMainService] Final result ready: "${text}"`);
            this.notifyTranscript(text, true);
            this.lastPartialText = '';
          }
        } else {
          const rawPartial = this.recognizer.partialResult();
          const parsed = typeof rawPartial === 'string' ? JSON.parse(rawPartial) : rawPartial;
          const partialText = parsed?.partial ? parsed.partial.trim() : '';

          // Deduplicate partial transcript events
          if (partialText && partialText !== this.lastPartialText) {
            this.lastPartialText = partialText;
            console.log(`[VoiceMainService] Partial result: "${partialText}"`);
            this.notifyTranscript(partialText, false);
          }
        }
      }
    } catch (err: any) {
      console.error('[VoiceMainService] Error processing PCM chunk:', err);
      this.notifyError(`PCM processing error: ${err.message}`, 'pcm-error');
    }
  }

  /**
   * Stop speech recognition session
   */
  public async stopSession(): Promise<void> {
    console.log('[VoiceMainService] Stop session requested');
    if (!this.isSessionActive) {
      return;
    }

    this.isSessionActive = false;

    try {
      if (this.recognizer) {
        // Flush remaining PCM accumulator batch
        if (this.pcmAccumulator.length > 0) {
          const remainingBuffer = Buffer.from(this.pcmAccumulator);
          this.pcmAccumulator = [];
          this.recognizer.acceptWaveform(remainingBuffer);
        }

        // Retrieve final result from Vosk recognizer
        const rawFinal = this.recognizer.finalResult();
        const parsed = typeof rawFinal === 'string' ? JSON.parse(rawFinal) : rawFinal;
        const finalResult = parsed?.text ? parsed.text.trim() : '';

        if (finalResult) {
          console.log(`[VoiceMainService] Final transcript on stop: "${finalResult}"`);
          this.notifyTranscript(finalResult, true);
        }
      }
    } catch (err: any) {
      console.error('[VoiceMainService] Error retrieving final result on stop:', err);
    } finally {
      this.freeRecognizer();
      this.pcmAccumulator = [];
      this.lastPartialText = '';
      this.setState('idle');
    }
  }

  public getState(): VoiceMainState {
    return this.state;
  }

  /**
   * Explicitly free recognizer native instance
   */
  private freeRecognizer(): void {
    if (this.recognizer) {
      try {
        if (typeof this.recognizer.free === 'function') {
          this.recognizer.free();
        }
      } catch (err) {
        console.error('[VoiceMainService] Error freeing recognizer:', err);
      }
      this.recognizer = null;
      console.log('[VoiceMainService] Session recognizer freed');
    }
  }

  /**
   * Explicitly free model native instance
   */
  private freeModel(): void {
    if (this.model) {
      try {
        if (typeof this.model.free === 'function') {
          this.model.free();
        }
      } catch (err) {
        console.error('[VoiceMainService] Error freeing model:', err);
      }
      this.model = null;
      console.log('[VoiceMainService] Model freed');
    }
  }

  /**
   * Full teardown on application exit / window close
   */
  public dispose(): void {
    console.log('[VoiceMainService] Disposing VoiceMainService (freeing recognizer & model)');
    this.stopSession();
    this.freeRecognizer();
    this.freeModel();
    this.targetWindow = null;
    this.setState('idle');
  }

  private setState(newState: VoiceMainState): void {
    this.state = newState;
    console.log(`[VoiceMainService] State changed: ${newState}`);
    if (this.targetWindow && !this.targetWindow.isDestroyed()) {
      this.targetWindow.webContents.send('voice:state', newState);
    }
  }

  private notifyTranscript(text: string, isFinal: boolean): void {
    if (this.targetWindow && !this.targetWindow.isDestroyed()) {
      const payload: VoiceTranscriptPayload = { text, isFinal };
      this.targetWindow.webContents.send('voice:transcript', payload);
    }
  }

  private notifyError(message: string, code?: string): void {
    if (this.targetWindow && !this.targetWindow.isDestroyed()) {
      const payload: VoiceErrorPayload = { message, code };
      this.targetWindow.webContents.send('voice:error', payload);
    }
  }
}

export const voiceMainService = VoiceMainService.getInstance();
export default voiceMainService;
