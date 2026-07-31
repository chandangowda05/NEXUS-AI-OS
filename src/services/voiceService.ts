/**
 * NEXUS AI OS — VoiceService Orchestrator
 *
 * Coordinates Speech-to-Text via pluggable IVoiceProvider and Text-to-Speech via SpeechQueue.
 * Manages reactive subscriptions, configurable transcript auto-sending, and clean resource disposal.
 */

import {
  VoiceState,
  VoiceStatus,
  VoiceOptions,
  VoiceProviderType,
  VoiceStatusListener,
  TranscriptListener,
  MicPermissionState,
} from '../types/voice';
import { IVoiceProvider } from '../voice/providers/IVoiceProvider';
import { WebSpeechProvider } from '../voice/providers/WebSpeechProvider';
import { MockProvider } from '../voice/providers/MockProvider';
import { SpeechQueue } from '../tts/SpeechQueue';

// ─── Debug logger ────────────────────────────────────────────────────────────
const TAG = '[NEXUS/VoiceService]';
const log = (...args: any[]) => console.log(TAG, ...args);
const warn = (...args: any[]) => console.warn(TAG, ...args);
const err = (...args: any[]) => console.error(TAG, ...args);
// ─────────────────────────────────────────────────────────────────────────────

import { ProviderFactory } from '../voice/providers/ProviderFactory';

export class VoiceService {
  private static instance: VoiceService;

  private provider: IVoiceProvider;
  private speechQueue: SpeechQueue;

  private state: VoiceState = 'idle';
  private transcript = '';
  private interimTranscript = '';
  private errorMessage: string | null = null;
  private micPermissionState: MicPermissionState = 'unknown';
  private autoSendVoiceCommands = false;
  private providerType: VoiceProviderType = 'webspeech';

  private statusListeners: Set<VoiceStatusListener> = new Set();
  private transcriptListeners: Set<TranscriptListener> = new Set();

  private constructor(injectedProvider?: IVoiceProvider) {
    log('=== VoiceService singleton created ===');
    log('Initializing SpeechQueue...');
    this.speechQueue = new SpeechQueue();

    log('Creating provider via ProviderFactory / DI...');
    this.provider = injectedProvider || ProviderFactory.createProvider();
    log('Provider name:', this.provider.name);
    log('Provider.isSupported():', this.provider.isSupported());

    this.initProvider();
    this.initMicPermissionCheck();
    this.initQueueSubscription();

    log('VoiceService constructor complete. Initial status:', JSON.stringify(this.getStatus()));
  }

  public static getInstance(injectedProvider?: IVoiceProvider): VoiceService {
    if (!VoiceService.instance) {
      log('getInstance() — creating new singleton instance');
      VoiceService.instance = new VoiceService(injectedProvider);
    } else {
      log('getInstance() — returning existing singleton instance');
    }
    return VoiceService.instance;
  }

  /**
   * Initialize provider callbacks
   */
  private initProvider(): void {
    log('initProvider() — registering callbacks on provider:', this.provider.name);
    this.provider.setCallbacks({
      onTranscript: (text: string, isFinal: boolean) => {
        log(`onTranscript callback — isFinal=${isFinal} text="${text}"`);
        if (isFinal) {
          this.transcript = text;
          this.interimTranscript = '';
          log('onTranscript: final — saved transcript, clearing interim');
          this.notifyTranscript(this.transcript, true);
        } else {
          this.interimTranscript = text;
          log('onTranscript: interim — saved interimTranscript');
          this.notifyTranscript(text, false);
        }
        this.notifyStatus();
      },
      onError: (errorMsg: string, code?: string) => {
        err('onError callback fired!', { errorMsg, code });
        this.errorMessage = errorMsg;
        const isRecoverable = code === 'network' || code === 'no-speech' || code === 'aborted';
        if (isRecoverable) {
          log(`onError: Recoverable voice error (${code}). Returning to IDLE state.`);
          this.setState('idle');
        } else {
          this.setState('error');
        }
        this.notifyStatus();
      },
      onStateChange: (newState: VoiceState) => {
        log('onStateChange callback — provider changed state to:', newState);
        this.setState(newState);
      },
    });
    log('initProvider() — callbacks registered');
  }

  private initQueueSubscription(): void {
    log('initQueueSubscription() — subscribing to SpeechQueue changes');
    this.speechQueue.subscribe((isSpeaking) => {
      log('SpeechQueue subscriber fired — isSpeaking:', isSpeaking, '| current state:', this.state);
      if (isSpeaking && this.state !== 'speaking') {
        log('SpeechQueue: transitioning state → "speaking"');
        this.setState('speaking');
      } else if (!isSpeaking && this.state === 'speaking') {
        log('SpeechQueue: speech ended — transitioning state → "idle"');
        this.setState('idle');
      }
      this.notifyStatus();
    });
  }

  private async initMicPermissionCheck(): Promise<void> {
    log('initMicPermissionCheck() — checking navigator.permissions for microphone...');
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        log('Microphone permission state:', result.state);
        this.micPermissionState = result.state as MicPermissionState;
        result.onchange = () => {
          log('Microphone permission state CHANGED:', result.state);
          this.micPermissionState = result.state as MicPermissionState;
          this.notifyStatus();
        };
      } catch (permErr: any) {
        warn('initMicPermissionCheck() — permissions.query threw:', permErr?.message);
        warn('  (This is normal in some browsers/webviews that do not support the Permissions API)');
      }
    } else {
      warn('initMicPermissionCheck() — navigator.permissions not available in this environment');
    }
  }

  // ── PROVIDER MANAGEMENT ──

  /**
   * Switch speech recognition provider dynamically (e.g. WebSpeech, Mock, Whisper, Vosk)
   */
  public setProvider(newProvider: IVoiceProvider, type: VoiceProviderType): void {
    log('setProvider() — switching provider:', this.provider?.name, '→', newProvider.name, '| type:', type);
    if (this.provider) {
      log('setProvider() — disposing old provider:', this.provider.name);
      this.provider.dispose();
    }
    this.provider = newProvider;
    this.providerType = type;
    this.initProvider();
    this.notifyStatus();
    log('setProvider() — provider switched to:', newProvider.name);
  }

  public getProviderType(): VoiceProviderType {
    return this.providerType;
  }

  // ── STT CONTROL ──

  public startListening(lang?: string): void {
    console.log('🔥 [NEXUS/VoiceService] startListening() ENTERED — state:', this.state, '| provider:', this.provider?.name);
    log('startListening() called', { lang, currentState: this.state, providerType: this.providerType });

    const queueStatus = this.speechQueue.getStatus();
    log('startListening() — SpeechQueue status:', queueStatus);
    if (queueStatus.isSpeaking) {
      log('startListening() — TTS is active; cancelling speech first');
      this.stopSpeaking();
    }

    this.transcript = '';
    this.interimTranscript = '';
    this.errorMessage = null;
    log('startListening() — reset transcript/error state');

    const supported = this.provider.isSupported();
    log('startListening() — provider.isSupported():', supported);
    if (!supported) {
      console.log('🔥 [NEXUS/VoiceService] Provider not supported — falling back to MockProvider');
      warn('startListening() — provider not supported; falling back to MockProvider');
      this.setProvider(new MockProvider(), 'mock');
    }

    console.log('🔥 [NEXUS/VoiceService] Calling provider.startListening() — provider:', this.provider?.name);
    log('startListening() — calling provider.startListening()...');
    try {
      this.provider.startListening(lang);
      console.log('🔥 [NEXUS/VoiceService] provider.startListening() returned');
      log('startListening() — provider.startListening() returned (async operations may still be pending)');
    } catch (startErr: any) {
      console.log('🔥 [NEXUS/VoiceService] provider.startListening() THREW:', startErr?.message);
      err('startListening() — provider.startListening() threw synchronously!', startErr);
      err('Stack:', startErr?.stack);
    }
  }

  public stopListening(): void {
    log('stopListening() called — current state:', this.state);
    try {
      this.provider.stopListening();
    } catch (stopErr: any) {
      warn('stopListening() — provider.stopListening() threw:', stopErr?.message);
    }
  }

  public toggleListening(lang?: string): void {
    console.log('🔥 [NEXUS/VoiceService] toggleListening() ENTERED — current state:', this.state);
    log('toggleListening() called — current state:', this.state);
    if (this.state === 'listening') {
      console.log('🔥 [NEXUS/VoiceService] Already listening — will STOP');
      log('toggleListening() — currently listening; stopping');
      this.stopListening();
    } else {
      console.log('🔥 [NEXUS/VoiceService] Not listening — will START');
      log('toggleListening() — not listening; starting');
      this.startListening(lang);
    }
  }

  // ── TTS CONTROL ──

  public speak(text: string, options?: VoiceOptions): string {
    log('speak() called — text length:', text.length, '| options:', options);
    return this.speechQueue.enqueue(text, options);
  }

  public stopSpeaking(): void {
    log('stopSpeaking() called — current state:', this.state);
    this.speechQueue.cancel();
  }

  // ── CONFIGURATION & OPTIONS ──

  public setAutoSendVoiceCommands(enabled: boolean): void {
    log('setAutoSendVoiceCommands():', enabled);
    this.autoSendVoiceCommands = enabled;
    this.notifyStatus();
  }

  public getAutoSendVoiceCommands(): boolean {
    return this.autoSendVoiceCommands;
  }

  public setVoiceOptions(options: Partial<VoiceOptions>): void {
    log('setVoiceOptions():', options);
    this.speechQueue.setOptions(options);
  }

  // ── STATE & SUBSCRIBERS ──

  public getStatus(): VoiceStatus {
    const queueStatus = this.speechQueue.getStatus();
    return {
      state: this.state,
      isListening: this.state === 'listening',
      isSpeaking: queueStatus.isSpeaking || this.state === 'speaking',
      transcript: this.transcript,
      interimTranscript: this.interimTranscript,
      error: this.errorMessage,
      micPermission: this.micPermissionState,
      queueCount: queueStatus.queueCount,
      providerType: this.providerType,
      autoSendVoiceCommands: this.autoSendVoiceCommands,
    };
  }

  public subscribe(listener: VoiceStatusListener): () => void {
    log('subscribe() — new status listener registered (total now:', this.statusListeners.size + 1, ')');
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
      log('subscribe() — listener unregistered (remaining:', this.statusListeners.size, ')');
    };
  }

  public onTranscript(listener: TranscriptListener): () => void {
    log('onTranscript() — new transcript listener registered');
    this.transcriptListeners.add(listener);
    return () => {
      this.transcriptListeners.delete(listener);
      log('onTranscript() — transcript listener unregistered');
    };
  }

  private setState(newState: VoiceState): void {
    const prev = this.state;
    this.state = newState;
    log(`setState() — "${prev}" → "${newState}"`);
    this.notifyStatus();
  }

  private notifyStatus(): void {
    const status = this.getStatus();
    this.statusListeners.forEach((listener) => listener(status));
  }

  private notifyTranscript(text: string, isFinal: boolean): void {
    this.transcriptListeners.forEach((listener) => listener(text, isFinal));
  }

  // ── LIFECYCLE CLEANUP ──

  /**
   * Full cleanup for window reloads and service teardown
   */
  public dispose(): void {
    log('dispose() called — tearing down VoiceService');
    if (this.provider) {
      log('dispose() — disposing provider:', this.provider.name);
      this.provider.dispose();
    }
    if (this.speechQueue) {
      log('dispose() — disposing SpeechQueue');
      this.speechQueue.dispose();
    }
    this.statusListeners.clear();
    this.transcriptListeners.clear();
    this.state = 'idle';
    this.transcript = '';
    this.interimTranscript = '';
    this.errorMessage = null;
    log('dispose() — complete');
  }
}

export const voiceService = VoiceService.getInstance();
export default voiceService;
