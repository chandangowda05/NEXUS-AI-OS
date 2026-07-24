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

  private constructor() {
    this.speechQueue = new SpeechQueue();
    this.provider = new WebSpeechProvider();
    this.initProvider();
    this.initMicPermissionCheck();
    this.initQueueSubscription();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  /**
   * Initialize provider callbacks
   */
  private initProvider(): void {
    this.provider.setCallbacks({
      onTranscript: (text: string, isFinal: boolean) => {
        if (isFinal) {
          this.transcript = text;
          this.interimTranscript = '';
          this.notifyTranscript(this.transcript, true);
        } else {
          this.interimTranscript = text;
          this.notifyTranscript(text, false);
        }
        this.notifyStatus();
      },
      onError: (errorMsg: string) => {
        this.errorMessage = errorMsg;
        this.setState('error');
        this.notifyStatus();
      },
      onStateChange: (newState: VoiceState) => {
        this.setState(newState);
      },
    });
  }

  private initQueueSubscription(): void {
    this.speechQueue.subscribe((isSpeaking) => {
      if (isSpeaking && this.state !== 'speaking') {
        this.setState('speaking');
      } else if (!isSpeaking && this.state === 'speaking') {
        this.setState('idle');
      }
      this.notifyStatus();
    });
  }

  private async initMicPermissionCheck(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        this.micPermissionState = result.state as MicPermissionState;
        result.onchange = () => {
          this.micPermissionState = result.state as MicPermissionState;
          this.notifyStatus();
        };
      } catch (_e) {
        // Microphone permission API not available in all webviews
      }
    }
  }

  // ── PROVIDER MANAGEMENT ──

  /**
   * Switch speech recognition provider dynamically (e.g. WebSpeech, Mock, Whisper, Vosk)
   */
  public setProvider(newProvider: IVoiceProvider, type: VoiceProviderType): void {
    if (this.provider) {
      this.provider.dispose();
    }
    this.provider = newProvider;
    this.providerType = type;
    this.initProvider();
    this.notifyStatus();
  }

  public getProviderType(): VoiceProviderType {
    return this.providerType;
  }

  // ── STT CONTROL ──

  public startListening(lang?: string): void {
    if (this.speechQueue.getStatus().isSpeaking) {
      this.stopSpeaking();
    }

    this.transcript = '';
    this.interimTranscript = '';
    this.errorMessage = null;

    if (!this.provider.isSupported()) {
      // Fallback to MockProvider if WebSpeech is unsupported
      this.setProvider(new MockProvider(), 'mock');
    }

    this.provider.startListening(lang);
  }

  public stopListening(): void {
    this.provider.stopListening();
  }

  public toggleListening(lang?: string): void {
    if (this.state === 'listening') {
      this.stopListening();
    } else {
      this.startListening(lang);
    }
  }

  // ── TTS CONTROL ──

  public speak(text: string, options?: VoiceOptions): string {
    return this.speechQueue.enqueue(text, options);
  }

  public stopSpeaking(): void {
    this.speechQueue.cancel();
  }

  // ── CONFIGURATION & OPTIONS ──

  public setAutoSendVoiceCommands(enabled: boolean): void {
    this.autoSendVoiceCommands = enabled;
    this.notifyStatus();
  }

  public getAutoSendVoiceCommands(): boolean {
    return this.autoSendVoiceCommands;
  }

  public setVoiceOptions(options: Partial<VoiceOptions>): void {
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
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onTranscript(listener: TranscriptListener): () => void {
    this.transcriptListeners.add(listener);
    return () => {
      this.transcriptListeners.delete(listener);
    };
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
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
    if (this.provider) {
      this.provider.dispose();
    }
    if (this.speechQueue) {
      this.speechQueue.dispose();
    }
    this.statusListeners.clear();
    this.transcriptListeners.clear();
    this.state = 'idle';
    this.transcript = '';
    this.interimTranscript = '';
    this.errorMessage = null;
  }
}

export const voiceService = VoiceService.getInstance();
export default voiceService;
