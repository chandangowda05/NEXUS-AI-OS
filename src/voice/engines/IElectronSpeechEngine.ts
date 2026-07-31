/**
 * NEXUS AI OS — IElectronSpeechEngine Interface
 *
 * Pluggable Speech Engine Contract for Electron Desktop environments.
 * Decouples ElectronVoiceProvider from concrete engines (Vosk, Whisper, Gemini Live).
 */

import { VoiceState } from '../../types/voice';

export interface EngineCallbacks {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: string, code?: string) => void;
  onStateChange: (state: VoiceState) => void;
}

export interface IElectronSpeechEngine {
  /**
   * Unique identifier of the speech engine
   */
  readonly name: string;

  /**
   * Initialize engine assets, IPC channels, and local bindings
   */
  initialize(): Promise<void>;

  /**
   * Start streaming audio input to engine
   */
  startStream(lang?: string): Promise<void>;

  /**
   * Write Float32 mono PCM audio chunk to engine
   */
  writePCM(chunk: Float32Array): void;

  /**
   * Stop current streaming session
   */
  stopStream(): Promise<void>;

  /**
   * Register event callbacks
   */
  setCallbacks(callbacks: EngineCallbacks): void;

  /**
   * Check if engine is supported in current runtime
   */
  isSupported(): boolean;

  /**
   * Full cleanup of engine resources
   */
  dispose(): Promise<void>;
}
