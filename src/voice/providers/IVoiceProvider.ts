/**
 * NEXUS AI OS — IVoiceProvider Interface
 *
 * Pluggable Speech-to-Text Provider Contract for WebSpeech, Whisper, Vosk, Deepgram, etc.
 */

import { ProviderCallbacks, VoiceState } from '../../types/voice';

export interface IVoiceProvider {
  /**
   * Unique name of the speech provider
   */
  readonly name: string;

  /**
   * Initialize provider dependencies and resources
   */
  initialize(): Promise<void>;

  /**
   * Attach listener callbacks to the provider
   */
  setCallbacks(callbacks: ProviderCallbacks): void;

  /**
   * Start listening for voice input
   */
  startListening(lang?: string): void;

  /**
   * Stop listening for voice input
   */
  stopListening(): void;

  /**
   * Check if provider is supported in the current environment
   */
  isSupported(): boolean;

  /**
   * Get current state of the provider
   */
  getState(): VoiceState;

  /**
   * Cleanup all resources, event listeners, and background streams
   */
  dispose(): void;
}
