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

// ─── Debug logger ───────────────────────────────────────────────────────────
const TAG = '[NEXUS/WebSpeechProvider]';
const log = (...args: any[]) => console.log(TAG, ...args);
const warn = (...args: any[]) => console.warn(TAG, ...args);
const err = (...args: any[]) => console.error(TAG, ...args);
// ────────────────────────────────────────────────────────────────────────────

export class WebSpeechProvider implements IVoiceProvider {
  public readonly name = 'WebSpeech';

  private recognition: any = null;
  private isListeningActive = false;
  private state: VoiceState = 'idle';
  private callbacks: ProviderCallbacks | null = null;
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    log('initialize() called');
    log('window.SpeechRecognition      =', typeof window !== 'undefined' ? window.SpeechRecognition : 'N/A (no window)');
    log('window.webkitSpeechRecognition =', typeof window !== 'undefined' ? window.webkitSpeechRecognition : 'N/A (no window)');
    log('isSupported() =', this.isSupported());

    if (!this.isSupported()) {
      warn('initialize() — Web Speech API is NOT supported. Aborting initialization.');
      return;
    }

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      log('Using SpeechRecognition class:', SpeechRecognitionClass?.name ?? SpeechRecognitionClass);

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      log('SpeechRecognition instance created:', {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang,
      });

      // ── onstart ──────────────────────────────────────────────────────────
      this.recognition.onstart = () => {
        log('recognition.onstart fired — mic stream opened');
        this.isListeningActive = true;
        this.setState('listening');
      };

      // ── onresult ─────────────────────────────────────────────────────────
      this.recognition.onresult = (event: any) => {
        let finalScript = '';
        let interimScript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          const confidence = result[0].confidence;
          log(`recognition.onresult [${i}] isFinal=${result.isFinal} confidence=${confidence?.toFixed(3)} text="${text}"`);
          if (result.isFinal) {
            finalScript += text;
          } else {
            interimScript += text;
          }
        }

        if (finalScript && this.callbacks) {
          log('Emitting FINAL transcript:', JSON.stringify(finalScript.trim()));
          this.callbacks.onTranscript(finalScript.trim(), true);
        } else if (interimScript && this.callbacks) {
          log('Emitting INTERIM transcript:', JSON.stringify(interimScript));
          this.callbacks.onTranscript(interimScript, false);
        }
      };

      // ── onerror ──────────────────────────────────────────────────────────
      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        const errType: string = event.error;
        const errMsg: string = event.message ?? '(no message)';

        err('recognition.onerror fired!', {
          error: errType,
          message: errMsg,
          timeStamp: event.timeStamp,
        });

        let isRecoverable = false;
        let friendlyError = 'Speech recognition error occurred.';
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          friendlyError = 'Microphone access denied. Please allow microphone access in your browser.';
          err('ROOT CAUSE: Microphone permission denied by user or browser policy.');
        } else if (errType === 'no-speech') {
          friendlyError = 'No speech detected. Listening timed out.';
          isRecoverable = true;
          warn('ROOT CAUSE: no-speech — microphone captured silence for too long.');
        } else if (errType === 'audio-capture') {
          friendlyError = 'No microphone device found. Please check your audio settings.';
          err('ROOT CAUSE: audio-capture — browser cannot access microphone hardware.');
        } else if (errType === 'network') {
          friendlyError = 'Speech recognition service unavailable.';
          isRecoverable = true;
          err('ROOT CAUSE: network — speech service (usually Google) is unreachable.');
        } else if (errType === 'aborted') {
          warn('ROOT CAUSE: aborted — recognition was aborted (stop() called, or browser interrupted it).');
          friendlyError = 'Speech recognition was aborted.';
          isRecoverable = true;
        } else if (errType === 'language-not-supported') {
          err('ROOT CAUSE: language-not-supported — lang="' + this.recognition?.lang + '" is not supported by this browser.');
          friendlyError = 'Selected language is not supported by this browser.';
        } else {
          err('ROOT CAUSE: unknown error code "' + errType + '"');
        }

        if (isRecoverable) {
          log(`Recoverable error (${errType}). Setting state to "idle".`);
          this.setState('idle');
        } else {
          this.setState('error');
        }

        if (this.callbacks) {
          this.callbacks.onError(friendlyError, errType);
        }
      };

      // ── onend ────────────────────────────────────────────────────────────
      this.recognition.onend = () => {
        log('recognition.onend fired — mic stream closed. isListeningActive was:', this.isListeningActive, 'current state:', this.state);
        this.isListeningActive = false;
        if (this.state === 'listening') {
          log('onend: state was "listening" → transitioning to "idle"');
          this.setState('idle');
        } else {
          log('onend: state is "' + this.state + '" — not changing state');
        }
      };

      // ── onspeechstart / onspeechend (optional events) ────────────────────
      this.recognition.onspeechstart = () => {
        log('recognition.onspeechstart — speech started within audio stream');
      };
      this.recognition.onspeechend = () => {
        log('recognition.onspeechend — speech ended within audio stream');
      };
      this.recognition.onaudiostart = () => {
        log('recognition.onaudiostart — audio capture began');
      };
      this.recognition.onaudioend = () => {
        log('recognition.onaudioend — audio capture ended');
      };
      this.recognition.onnomatch = (event: any) => {
        warn('recognition.onnomatch — speech detected but no confident match.', event);
      };

      log('initialize() complete — all event handlers registered');
    } catch (initErr: any) {
      err('initialize() threw an exception!', initErr);
      err('Stack:', initErr?.stack);
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError(`Failed to initialize WebSpeech: ${initErr.message}`, 'init-exception');
      }
    }
  }

  public setCallbacks(callbacks: ProviderCallbacks): void {
    log('setCallbacks() — attaching provider callbacks');
    this.callbacks = callbacks;
  }

  public startListening(lang?: string): void {
    log('startListening() called', { lang, isSupported: this.isSupported(), hasRecognition: !!this.recognition, isListeningActive: this.isListeningActive });

    if (!this.isSupported()) {
      err('startListening() — Web Speech API is NOT supported in this browser/environment.');
      err('  window.SpeechRecognition:', typeof window !== 'undefined' ? window.SpeechRecognition : 'no window');
      err('  window.webkitSpeechRecognition:', typeof window !== 'undefined' ? window.webkitSpeechRecognition : 'no window');
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError('Web Speech API is not supported in this browser.', 'unsupported');
      }
      return;
    }

    if (!this.recognition) {
      log('startListening() — recognition not initialized yet; calling initialize() first...');
      this.initialize().then(() => {
        log('startListening() — initialize() resolved; calling doStartListening()');
        this.doStartListening(lang);
      }).catch((initErr: any) => {
        err('startListening() — initialize() rejected!', initErr);
        err('Stack:', initErr?.stack);
      });
    } else {
      log('startListening() — recognition already initialized; calling doStartListening() directly');
      this.doStartListening(lang);
    }
  }

  private doStartListening(lang?: string): void {
    log('doStartListening() called', { hasRecognition: !!this.recognition, isListeningActive: this.isListeningActive, lang });

    if (!this.recognition) {
      err('doStartListening() — recognition is null after initialize(); cannot start.');
      return;
    }

    if (this.isListeningActive) {
      warn('doStartListening() — already listening; ignoring duplicate start call');
      return;
    }

    if (lang) {
      log('doStartListening() — overriding lang to:', lang);
      this.recognition.lang = lang;
    }

    try {
      log('doStartListening() — calling recognition.start()...');
      this.recognition.start();
      log('doStartListening() — recognition.start() called successfully (waiting for onstart event)');
    } catch (startErr: any) {
      err('doStartListening() — recognition.start() threw!', startErr);
      err('  error.name:', startErr?.name);
      err('  error.message:', startErr?.message);
      err('  Stack:', startErr?.stack);
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError(`Microphone activation error: ${startErr.message}`, startErr?.name ?? 'start-exception');
      }
    }
  }

  public stopListening(): void {
    log('stopListening() called', { hasRecognition: !!this.recognition, isListeningActive: this.isListeningActive });

    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
        log('stopListening() — recognition.stop() called');
      } catch (stopErr: any) {
        warn('stopListening() — recognition.stop() threw (likely already stopped):', stopErr?.message);
      }
    } else {
      log('stopListening() — skipped (recognition null or not active)');
    }

    this.isListeningActive = false;
    if (this.state === 'listening') {
      log('stopListening() — state was "listening" → setting to "idle"');
      this.setState('idle');
    }
  }

  public isSupported(): boolean {
    const hasWindow = typeof window !== 'undefined';
    const hasSpeechRec = hasWindow && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    return hasSpeechRec;
  }

  public getState(): VoiceState {
    return this.state;
  }

  public dispose(): void {
    log('dispose() called — cleaning up all resources');
    this.stopListening();
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onspeechstart = null;
      this.recognition.onspeechend = null;
      this.recognition.onaudiostart = null;
      this.recognition.onaudioend = null;
      this.recognition.onnomatch = null;
      this.recognition = null;
      log('dispose() — recognition instance cleared');
    }
    this.callbacks = null;
    this.initialized = false;
    this.setState('idle');
    log('dispose() — complete');
  }

  private setState(newState: VoiceState): void {
    const prev = this.state;
    this.state = newState;
    log(`setState() — "${prev}" → "${newState}"`);
    if (this.callbacks) {
      this.callbacks.onStateChange(newState);
    } else {
      warn('setState() — no callbacks registered; state change not propagated!');
    }
  }
}
