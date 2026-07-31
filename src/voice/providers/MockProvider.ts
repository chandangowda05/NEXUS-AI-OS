/**
 * NEXUS AI OS — MockProvider Implementation
 *
 * Implements IVoiceProvider for unit testing, headless environments, and offline testing.
 */

import { IVoiceProvider } from './IVoiceProvider';
import { ProviderCallbacks, VoiceState } from '../../types/voice';

export class MockProvider implements IVoiceProvider {
  public readonly name = 'MockSpeech';

  private state: VoiceState = 'idle';
  private callbacks: ProviderCallbacks | null = null;
  private timer: any = null;

  public async initialize(): Promise<void> {
    this.setState('idle');
  }

  public setCallbacks(callbacks: ProviderCallbacks): void {
    this.callbacks = callbacks;
  }

  public startListening(_lang?: string): void {
    this.setState('listening');
    if (this.callbacks) {
      this.callbacks.onTranscript('Testing speech input', false);
    }
  }

  public simulateTranscript(text: string, isFinal = true): void {
    if (this.callbacks) {
      if (isFinal) {
        this.setState('processing');
        this.callbacks.onTranscript(text, true);
        this.setState('idle');
      } else {
        this.callbacks.onTranscript(text, false);
      }
    }
  }

  public simulateError(message: string, code?: string): void {
    if (code === 'network' || code === 'no-speech' || code === 'aborted') {
      this.setState('idle');
    } else {
      this.setState('error');
    }
    if (this.callbacks) {
      this.callbacks.onError(message, code);
    }
  }

  public stopListening(): void {
    if (this.timer) clearTimeout(this.timer);
    this.setState('idle');
  }

  public isSupported(): boolean {
    return true;
  }

  public getState(): VoiceState {
    return this.state;
  }

  public dispose(): void {
    this.stopListening();
    this.callbacks = null;
    this.setState('idle');
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    if (this.callbacks) {
      this.callbacks.onStateChange(newState);
    }
  }
}
