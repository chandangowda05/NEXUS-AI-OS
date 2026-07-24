/**
 * NEXUS AI OS — WebSpeechProvider Implementation
 *
 * Implements IVoiceProvider using browser Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 */

import { IVoiceProvider } from './IVoiceProvider';
import { ProviderCallbacks, VoiceState } from '../../types/voice';

// Extend window for Web Speech API typings
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class WebSpeechProvider implements IVoiceProvider {
  public readonly name = 'WebSpeech';

  private recognition: any = null;
  private isListeningActive = false;
  private state: VoiceState = 'idle';
  private callbacks: ProviderCallbacks | null = null;

  public async initialize(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        this.setState('listening');
      };

      this.recognition.onresult = (event: any) => {
        let finalScript = '';
        let interimScript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalScript += text;
          } else {
            interimScript += text;
          }
        }

        if (finalScript && this.callbacks) {
          this.callbacks.onTranscript(finalScript.trim(), true);
        } else if (interimScript && this.callbacks) {
          this.callbacks.onTranscript(interimScript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        const errType = event.error;

        let friendlyError = 'Speech recognition error occurred.';
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          friendlyError = 'Microphone access denied. Please allow microphone access in your browser.';
        } else if (errType === 'no-speech') {
          friendlyError = 'No speech detected. Listening timed out.';
        } else if (errType === 'audio-capture') {
          friendlyError = 'No microphone device found. Please check your audio settings.';
        } else if (errType === 'network') {
          friendlyError = 'Network error during speech recognition.';
        }

        this.setState('error');
        if (this.callbacks) {
          this.callbacks.onError(friendlyError, errType);
        }
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        if (this.state === 'listening') {
          this.setState('idle');
        }
      };
    } catch (err: any) {
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError(`Failed to initialize WebSpeech: ${err.message}`);
      }
    }
  }

  public setCallbacks(callbacks: ProviderCallbacks): void {
    this.callbacks = callbacks;
  }

  public startListening(lang?: string): void {
    if (!this.isSupported()) {
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError('Web Speech API is not supported in this browser.');
      }
      return;
    }

    if (!this.recognition) {
      this.initialize().then(() => this.doStartListening(lang));
    } else {
      this.doStartListening(lang);
    }
  }

  private doStartListening(lang?: string): void {
    if (this.recognition && !this.isListeningActive) {
      if (lang) this.recognition.lang = lang;
      try {
        this.recognition.start();
      } catch (err: any) {
        this.setState('error');
        if (this.callbacks) {
          this.callbacks.onError(`Microphone activation error: ${err.message}`);
        }
      }
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (_e) {
        // Ignore stop error if already stopped
      }
    }
    this.isListeningActive = false;
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  public getState(): VoiceState {
    return this.state;
  }

  public dispose(): void {
    this.stopListening();
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
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
