/**
 * NEXUS AI OS — ProviderFactory
 *
 * Environment-aware factory for creating IVoiceProvider instances.
 * Enables dependency injection for VoiceService without direct instantiation coupling.
 */

import { IVoiceProvider } from './IVoiceProvider';
import { WebSpeechProvider } from './WebSpeechProvider';
import { ElectronVoiceProvider } from './ElectronVoiceProvider';
import { MockProvider } from './MockProvider';
import { VoiceProviderType } from '../../types/voice';

export class ProviderFactory {
  /**
   * Create an IVoiceProvider instance based on environment auto-detection or explicit request.
   */
  public static createProvider(preferredType?: VoiceProviderType): IVoiceProvider {
    if (preferredType === 'mock') {
      return new MockProvider();
    }
    if (preferredType === 'webspeech') {
      return new WebSpeechProvider();
    }

    // Auto-detect environment: Electron Desktop vs Standard Web Browser
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return new ElectronVoiceProvider();
    }

    // Standard Browser default
    return new WebSpeechProvider();
  }
}
