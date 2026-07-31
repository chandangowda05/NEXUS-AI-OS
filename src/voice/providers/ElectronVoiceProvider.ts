/**
 * NEXUS AI OS — ElectronVoiceProvider Implementation
 *
 * Implements IVoiceProvider for Electron Desktop environments.
 * Communicates ONLY with IElectronSpeechEngine and AudioManager.
 * Contains zero direct Vosk or model download logic.
 */

import { IVoiceProvider } from './IVoiceProvider';
import { ProviderCallbacks, VoiceState } from '../../types/voice';
import { IElectronSpeechEngine } from '../engines/IElectronSpeechEngine';
import { WhisperEngine } from '../engines/WhisperEngine';
import { AudioManager } from '../audio/AudioManager';

export class ElectronVoiceProvider implements IVoiceProvider {
  public readonly name = 'ElectronVoice';

  private engine: IElectronSpeechEngine;
  private audioManager: AudioManager;

  private state: VoiceState = 'idle';
  private callbacks: ProviderCallbacks | null = null;
  private initialized = false;

  constructor(engine?: IElectronSpeechEngine, audioManager?: AudioManager) {
    this.engine = engine || new WhisperEngine();
    this.audioManager = audioManager || new AudioManager();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.engine.initialize();
  }

  public setCallbacks(callbacks: ProviderCallbacks): void {
    this.callbacks = callbacks;
    this.engine.setCallbacks({
      onTranscript: (text: string, isFinal: boolean) => {
        if (this.callbacks) this.callbacks.onTranscript(text, isFinal);
      },
      onError: (err: string, code?: string) => {
        this.setState('error');
        if (this.callbacks) this.callbacks.onError(err, code);
      },
      onStateChange: (newState: VoiceState) => {
        this.setState(newState);
      },
    });
  }

  public startListening(lang?: string): void {
    console.log(`[ElectronVoiceProvider] Audio started | lang: ${lang || 'default'}`);
    let pcmChunkCount = 0;
    this.initialize().then(async () => {
      await this.engine.startStream(lang);
      await this.audioManager.startCapture(undefined, (pcmChunk) => {
        pcmChunkCount++;
        if (pcmChunkCount === 1 || pcmChunkCount % 50 === 0) {
          console.log(`[ElectronVoiceProvider] PCM chunk count: ${pcmChunkCount} | IPC send buffer bytes: ${pcmChunk.byteLength}`);
        }
        this.engine.writePCM(pcmChunk);
      });
      this.setState('listening');
    }).catch((err) => {
      console.error('[ElectronVoiceProvider] Error in startListening:', err);
      this.setState('error');
      if (this.callbacks) {
        this.callbacks.onError(`Failed to start audio stream: ${err.message}`, 'stream-error');
      }
    });
  }

  public stopListening(): void {
    console.log('[ElectronVoiceProvider] Audio stopped');
    this.audioManager.stopCapture();
    this.engine.stopStream();
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  public getState(): VoiceState {
    return this.state;
  }

  public dispose(): void {
    this.stopListening();
    this.audioManager.dispose();
    this.engine.dispose();
    this.callbacks = null;
    this.initialized = false;
    this.setState('idle');
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    if (this.callbacks) {
      this.callbacks.onStateChange(newState);
    }
  }
}
