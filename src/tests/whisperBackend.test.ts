import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhisperRuntime } from '../voice/engines/WhisperRuntime';
import { modelManager } from '../voice/models/ModelManager';

describe('Whisper Backend (@huggingface/transformers) Unit Tests', () => {
  let mockPipeline: any;
  let mockPipelineLoader: any;
  let runtime: WhisperRuntime;

  beforeEach(() => {
    mockPipeline = vi.fn().mockImplementation(async (audio: any) => {
      return { text: 'hello world from whisper' };
    });
    mockPipeline.dispose = vi.fn().mockResolvedValue(undefined);

    mockPipelineLoader = vi.fn().mockResolvedValue(mockPipeline);
    runtime = new WhisperRuntime(mockPipelineLoader);
  });

  it('should initialize runtime and load whisper-tiny.en model via transformers pipeline', async () => {
    expect(runtime.getStatus()).toBe('uninitialized');
    expect(runtime.isReady()).toBe(false);

    await runtime.initialize('whisper-tiny.en');

    expect(mockPipelineLoader).toHaveBeenCalledWith(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny.en',
      { quantized: true }
    );
    expect(runtime.getStatus()).toBe('ready');
    expect(runtime.isReady()).toBe(true);
    expect(runtime.getCurrentModelId()).toBe('whisper-tiny.en');
    expect(runtime.getSession()?.pipelineInstance).toBe(mockPipeline);
  });

  it('should cache and reuse model instance on subsequent initialization calls', async () => {
    await runtime.initialize('whisper-tiny.en');
    expect(mockPipelineLoader).toHaveBeenCalledTimes(1);

    // Call initialize again with the same model
    await runtime.initialize('whisper-tiny.en');
    // Loader should NOT be called a second time
    expect(mockPipelineLoader).toHaveBeenCalledTimes(1);
    expect(runtime.isReady()).toBe(true);
  });

  it('should expose loadModel alias and transcribe API', async () => {
    await runtime.loadModel('whisper-tiny.en');
    expect(runtime.isReady()).toBe(true);

    const dummyAudio = new Float32Array([0.1, -0.2, 0.3]);
    const result = await runtime.transcribe(dummyAudio);

    expect(mockPipeline).toHaveBeenCalledWith(dummyAudio);
    expect(result.text).toBe('hello world from whisper');
    expect(result.confidence).toBe(1.0);
    expect(result.language).toBe('en');
  });

  it('should handle dispose and clean up pipeline resources', async () => {
    await runtime.initialize('whisper-tiny.en');
    expect(runtime.isReady()).toBe(true);

    await runtime.dispose();

    expect(mockPipeline.dispose).toHaveBeenCalled();
    expect(runtime.getStatus()).toBe('uninitialized');
    expect(runtime.isReady()).toBe(false);
    expect(runtime.getSession()).toBeNull();
  });

  it('should handle runtime initialization failure gracefully', async () => {
    const failingLoader = vi.fn().mockRejectedValue(new Error('Pipeline model load failed'));
    const failingRuntime = new WhisperRuntime(failingLoader);

    await expect(failingRuntime.initialize('whisper-tiny.en')).rejects.toThrow('Pipeline model load failed');
    expect(failingRuntime.getStatus()).toBe('failed');
    expect(failingRuntime.isReady()).toBe(false);
    expect(failingRuntime.getSession()).toBeNull();
  });
});
