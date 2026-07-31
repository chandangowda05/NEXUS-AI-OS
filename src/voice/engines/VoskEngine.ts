/**
 * NEXUS AI OS — VoskEngine Implementation
 *
 * Implements IElectronSpeechEngine using Vosk Kaldi offline STT.
 * Communicates with Electron main process IPC bridge and ModelManager.
 */

import { IElectronSpeechEngine, EngineCallbacks } from './IElectronSpeechEngine';
import { VoiceState } from '../../types/voice';
import { modelManager } from '../models/ModelManager';

export class VoskEngine implements IElectronSpeechEngine {
  public readonly name = 'VoskEngine';

  private state: VoiceState = 'idle';
  private callbacks: EngineCallbacks | null = null;
  private isStreaming = false;
  private unsubscribeListeners: (() => void)[] = [];

  public async initialize(): Promise<void> {
    console.log('[VoskEngine] Initializing VoskEngine...');
    const activeModel = modelManager.getActiveModel();
    if (!activeModel?.isDownloaded) {
      console.log(`[VoskEngine] Model ${activeModel?.id} not downloaded. Initiating download...`);
      await modelManager.downloadModel(activeModel?.id || 'vosk-small-en-us-0.15');
    }
    console.log('[VoskEngine] Model check complete.');
    this.setState('idle');
  }

  public async startStream(lang?: string): Promise<void> {
    this.isStreaming = true;
    this.setState('listening');
    console.log(`[VoskEngine] Starting stream | lang: ${lang || 'default'}`);

    if (typeof window !== 'undefined') {
      const api = (window as any).electronAPI;
      if (api?.voice?.start) {
        await api.voice.start(lang);
      } else if (api?.sendVoiceControl) {
        api.sendVoiceControl({ action: 'start', model: modelManager.getActiveModel()?.id });
      }
    }
  }

  public writePCM(chunk: Float32Array): void {
  if (!this.isStreaming) return;

  console.log("[VoskEngine] writePCM called");
  console.log("[VoskEngine] Samples:", chunk.length);
  console.log("[VoskEngine] Buffer bytes:", chunk.buffer.byteLength);

  if (typeof window !== 'undefined') {
    const api = (window as any).electronAPI;

    if (api?.voice?.sendAudioChunk) {
      console.log("[VoskEngine] Sending audio chunk to main process...");
      api.voice.sendAudioChunk(chunk.buffer);
    } else if (api?.sendAudioChunk) {
      console.log("[VoskEngine] Using fallback sendAudioChunk()");
      api.sendAudioChunk(chunk.buffer);
    } else {
      console.error("[VoskEngine] No sendAudioChunk API found!");
    }
  }
}

  public async stopStream(): Promise<void> {
    console.log('[VoskEngine] Stopping stream');
    this.isStreaming = false;
    if (typeof window !== 'undefined') {
      const api = (window as any).electronAPI;
      if (api?.voice?.stop) {
        await api.voice.stop();
      } else if (api?.sendVoiceControl) {
        api.sendVoiceControl({ action: 'stop' });
      }
    }
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  public setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
    this.cleanupListeners();

    if (typeof window !== 'undefined') {
      const api = (window as any).electronAPI;
      if (api?.voice) {
        if (api.voice.onTranscript) {
          const unsub = api.voice.onTranscript((data: { text: string; isFinal: boolean }) => {
            console.log(`[VoskEngine] Transcript received | text: "${data.text}" | isFinal: ${data.isFinal}`);
            if (this.callbacks) {
              this.callbacks.onTranscript(data.text, data.isFinal);
            }
          });
          if (typeof unsub === 'function') this.unsubscribeListeners.push(unsub);
        }

        if (api.voice.onError) {
          const unsub = api.voice.onError((data: { message: string; code?: string }) => {
            console.error(`[VoskEngine] Voice error received: ${data.message}`);
            if (this.callbacks) {
              this.callbacks.onError(data.message, data.code);
            }
          });
          if (typeof unsub === 'function') this.unsubscribeListeners.push(unsub);
        }

        if (api.voice.onStateChanged) {
          const unsub = api.voice.onStateChanged((state: string) => {
            console.log(`[VoskEngine] Main state changed to: ${state}`);
            if (state === 'listening' || state === 'idle' || state === 'processing' || state === 'error') {
              this.setState(state as VoiceState);
            }
          });
          if (typeof unsub === 'function') this.unsubscribeListeners.push(unsub);
        }
      } else if (api?.onVoiceTranscript) {
        api.onVoiceTranscript((data: { text: string; isFinal: boolean }) => {
          if (this.callbacks) {
            this.callbacks.onTranscript(data.text, data.isFinal);
          }
        });
      }
    }
  }

  public isSupported(): boolean {
    return true;
  }

  public async dispose(): Promise<void> {
    await this.stopStream();
    this.cleanupListeners();
    this.callbacks = null;
    this.setState('idle');
  }

  private cleanupListeners(): void {
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    if (this.callbacks) {
      this.callbacks.onStateChange(newState);
    }
  }
}
