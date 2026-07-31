import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhisperEngine } from '../voice/engines/WhisperEngine';
import { WhisperRuntime } from '../voice/engines/WhisperRuntime';

describe('Whisper Real Inference Unit Tests', () => {
  let engine: WhisperEngine;
  let runtime: WhisperRuntime;
  let mockPipeline: any;
  let mockPipelineLoader: any;

  beforeEach(() => {
    mockPipeline = vi.fn().mockImplementation(async (audio: Float32Array) => {
      return { text: 'Hello NEXUS' };
    });
    mockPipeline.dispose = vi.fn().mockResolvedValue(undefined);

    mockPipelineLoader = vi.fn().mockResolvedValue(mockPipeline);
    runtime = new WhisperRuntime(mockPipelineLoader);
    engine = new WhisperEngine(runtime);
  });

  it('should successfully record PCM audio, process inference, and emit final transcript', async () => {
    const onTranscript = vi.fn();
    const onError = vi.fn();
    const states: string[] = [];

    engine.setCallbacks({
      onTranscript,
      onError,
      onStateChange: (state) => {
        states.push(state);
      },
    });

    await engine.initialize(); // 'idle'
    await engine.startStream('en-US'); // 'listening'

    const pcmChunk1 = new Float32Array([0.01, 0.02, 0.03]);
    const pcmChunk2 = new Float32Array([0.04, 0.05, 0.06]);
    engine.writePCM(pcmChunk1);
    engine.writePCM(pcmChunk2);

    expect(engine.getBufferedChunks()).toHaveLength(2);

    await engine.stopStream(); // transitions to 'processing' -> 'idle'

    expect(mockPipeline).toHaveBeenCalled();
    expect(onTranscript).toHaveBeenCalledWith('Hello NEXUS', true);
    expect(onError).not.toHaveBeenCalled();
    expect(states).toContain('listening');
    expect(states).toContain('processing');
    expect(engine.getState()).toBe('idle');
  });

  it('should reject empty audio buffer and emit structured error', async () => {
    const onTranscript = vi.fn();
    const onError = vi.fn();

    engine.setCallbacks({
      onTranscript,
      onError,
      onStateChange: vi.fn(),
    });

    await engine.initialize();
    await engine.startStream();
    // Do NOT write any PCM chunks

    await engine.stopStream();

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Empty audio buffer'),
      'transcription_failed'
    );
    expect(onTranscript).not.toHaveBeenCalled();
    expect(engine.getState()).toBe('error');
  });

  it('should ignore invalid or non-Float32Array PCM chunks safely', async () => {
    await engine.initialize();
    await engine.startStream();

    // Pass invalid PCM chunk
    engine.writePCM(null as any);
    engine.writePCM(undefined as any);
    engine.writePCM(new Float32Array(0));

    expect(engine.getBufferedChunks()).toHaveLength(0);
  });

  it('should handle uninitialized runtime during stopStream gracefully', async () => {
    const uninitializedRuntime = new WhisperRuntime(mockPipelineLoader);
    const uninitializedEngine = new WhisperEngine(uninitializedRuntime);

    const onError = vi.fn();
    uninitializedEngine.setCallbacks({
      onTranscript: vi.fn(),
      onError,
      onStateChange: vi.fn(),
    });

    await uninitializedEngine.startStream();
    uninitializedEngine.writePCM(new Float32Array([0.1, 0.2]));

    await uninitializedEngine.stopStream();

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Whisper runtime is not initialized'),
      'transcription_failed'
    );
    expect(uninitializedEngine.getState()).toBe('error');
  });

  it('should handle transcription failure gracefully without crashing', async () => {
    const failingPipeline = vi.fn().mockRejectedValue(new Error('Inference V8 memory error'));
    const failingLoader = vi.fn().mockResolvedValue(failingPipeline);
    const failingRuntime = new WhisperRuntime(failingLoader);
    const failingEngine = new WhisperEngine(failingRuntime);

    const onError = vi.fn();
    failingEngine.setCallbacks({
      onTranscript: vi.fn(),
      onError,
      onStateChange: vi.fn(),
    });

    await failingEngine.initialize();
    await failingEngine.startStream();
    failingEngine.writePCM(new Float32Array([0.1, 0.2]));

    await failingEngine.stopStream();

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Inference V8 memory error'),
      'transcription_failed'
    );
    expect(failingEngine.getState()).toBe('error');
  });
});
