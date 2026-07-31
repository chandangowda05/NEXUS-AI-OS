declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: new () => AudioWorkletProcessor
): void;

class PCMProcessor extends AudioWorkletProcessor {
  public process(inputs: Float32Array[][]): boolean {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      if (channelData && channelData.length > 0) {
        // Copy float array to post to main thread safely
        const chunk = new Float32Array(channelData);
        this.port.postMessage(chunk);
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
