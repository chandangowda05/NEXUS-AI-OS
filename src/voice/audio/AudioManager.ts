/**
 * NEXUS AI OS — Dedicated Audio Manager
 *
 * Manages Web Audio API pipeline, device selection, software gain, mute control,
 * AudioWorklet capture, and sample-rate downsampling (hardware rate -> 16kHz mono).
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private gainNode: GainNode | null = null;

  private isCapturing = false;
  private isMuted = false;
  private gainValue = 1.0;
  private targetSampleRate = 16000;

  private onPCMChunkCallback: ((pcm: Float32Array) => void) | null = null;

  /**
   * Enumerate available microphone devices
   */
  public async enumerateMicrophones(): Promise<AudioDevice[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
    } catch (_err) {
      return [];
    }
  }

  /**
   * Start microphone audio capture with AudioWorklet and 16kHz resampling
   */
  public async startCapture(
    deviceId?: string,
    onPCMChunk?: (pcm: Float32Array) => void
  ): Promise<void> {
    if (this.isCapturing) {
      this.stopCapture();
    }

    if (onPCMChunk) {
      this.onPCMChunkCallback = onPCMChunk;
    }

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    };

    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.isMuted ? 0 : this.gainValue;

    // Load AudioWorklet or fallback to ScriptProcessor if worklet loading fails
    try {
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0];
            if (input && input.length > 0 && input[0].length > 0) {
              this.port.postMessage(new Float32Array(input[0]));
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);

      await this.audioContext.audioWorklet.addModule(workletUrl);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

      this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (this.isMuted || !this.onPCMChunkCallback) return;
        const rawPCM = event.data;
        const resampled = this.resampleTo16kHz(rawPCM, this.audioContext?.sampleRate || 44100);
        this.onPCMChunkCallback(resampled);
      };

      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);

      URL.revokeObjectURL(workletUrl);
    } catch (_workletErr) {
      // Fallback: ScriptProcessorNode if AudioWorklet blob fails in restrictive contexts
      const bufferSize = 4096;
      const scriptNode = (this.audioContext as any).createScriptProcessor(bufferSize, 1, 1);
      scriptNode.onaudioprocess = (e: any) => {
        if (this.isMuted || !this.onPCMChunkCallback) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const resampled = this.resampleTo16kHz(inputData, this.audioContext?.sampleRate || 44100);
        this.onPCMChunkCallback(resampled);
      };
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(scriptNode);
      scriptNode.connect(this.audioContext.destination);
    }

    this.isCapturing = true;
  }

  /**
   * Resample Float32 audio from native hardware rate (e.g. 48kHz/44.1kHz) to 16kHz mono
   */
  private resampleTo16kHz(audioData: Float32Array, originalSampleRate: number): Float32Array {
    if (originalSampleRate === this.targetSampleRate) {
      return audioData;
    }

    const compression = originalSampleRate / this.targetSampleRate;
    const resultLength = Math.round(audioData.length / compression);
    const result = new Float32Array(resultLength);

    let resultOffset = 0;
    let inputOffset = 0;

    while (resultOffset < resultLength) {
      const nextInputOffset = Math.round((resultOffset + 1) * compression);
      let sum = 0;
      let count = 0;

      for (let i = inputOffset; i < nextInputOffset && i < audioData.length; i++) {
        sum += audioData[i];
        count++;
      }

      result[resultOffset] = count > 0 ? sum / count : 0;
      resultOffset++;
      inputOffset = nextInputOffset;
    }

    return result;
  }

  public setGain(gain: number): void {
    this.gainValue = Math.max(0, Math.min(5, gain));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.value = this.gainValue;
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.gainValue;
    }
  }

  public stopCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (_e) {
        // Ignore close errors
      }
      this.audioContext = null;
    }
    this.isCapturing = false;
  }

  public dispose(): void {
    this.stopCapture();
    this.onPCMChunkCallback = null;
  }
}
