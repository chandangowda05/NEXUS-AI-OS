/**
 * NEXUS AI OS — Modular Voice Engine Types & Provider Interfaces
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export type VoiceProviderType = 'webspeech' | 'mock' | 'whisper' | 'vosk';

export interface VoiceOptions {
  lang?: string;
  rate?: number; // 0.1 to 10 (default 1.0)
  pitch?: number; // 0 to 2 (default 1.0)
  volume?: number; // 0 to 1 (default 1.0)
  voiceName?: string;
}

export interface VoiceConfig {
  providerType: VoiceProviderType;
  autoSendVoiceCommands: boolean;
  options: VoiceOptions;
}

export interface VoiceStatus {
  state: VoiceState;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  micPermission: MicPermissionState;
  queueCount: number;
  providerType: VoiceProviderType;
  autoSendVoiceCommands: boolean;
}

export interface ProviderCallbacks {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: string, code?: string) => void;
  onStateChange: (state: VoiceState) => void;
}

export type VoiceStatusListener = (status: VoiceStatus) => void;
export type TranscriptListener = (transcript: string, isFinal: boolean) => void;
