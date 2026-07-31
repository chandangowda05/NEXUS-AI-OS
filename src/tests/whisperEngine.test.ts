import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhisperEngine } from '../voice/engines/WhisperEngine';
import { WhisperRuntime } from '../voice/engines/WhisperRuntime';
import { modelManager } from '../voice/models/ModelManager';

describe('WhisperEngine Unit Tests', () => {
  let engine: WhisperEngine;
  let mockPipelineLoader: any;

  beforeEach(() => {
    const mockPipeline: any = vi.fn().mockResolvedValue({ text: 'mock transcript' });
    mockPipeline.dispose = vi.fn().mockResolvedValue(undefined);
    mockPipelineLoader = vi.fn().mockResolvedValue(mockPipeline);
    WhisperRuntime.setDefaultPipelineLoader(mockPipelineLoader);
    engine = new WhisperEngine();
  });

  it('should initialize and load model metadata', async () => {
    expect(engine.name).toBe('WhisperEngine');
    expect(engine.isSupported()).toBe(true);
    await engine.initialize();
    const activeModel = modelManager.getActiveModel();
    expect(activeModel?.id).toBe('whisper-tiny.en');
  });

  it('should handle lifecycle state transitions', async () => {
    let currentState = 'idle';
    engine.setCallbacks({
      onTranscript: vi.fn(),
      onError: vi.fn(),
      onStateChange: (state) => {
        currentState = state;
      },
    });

    await engine.initialize();
    expect(currentState).toBe('idle');

    await engine.startStream('en-US');
    expect(currentState).toBe('listening');

    engine.writePCM(new Float32Array([0.1, 0.2, 0.3]));

    await engine.stopStream();
    expect(currentState).toBe('idle');
  });

  it('should register and execute callbacks correctly', () => {
    const onTranscript = vi.fn();
    const onError = vi.fn();
    const onStateChange = vi.fn();

    engine.setCallbacks({ onTranscript, onError, onStateChange });
    engine.writePCM(new Float32Array([0.1, 0.2, 0.3]));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('should buffer PCM data during active stream', async () => {
    await engine.initialize();
    await engine.startStream();

    const chunk1 = new Float32Array([0.1, 0.2, 0.3]);
    const chunk2 = new Float32Array([0.4, 0.5, 0.6]);

    engine.writePCM(chunk1);
    engine.writePCM(chunk2);

    expect(engine.getBufferedChunks()).toHaveLength(2);
    expect(engine.getBufferedChunks()[0]).toEqual(chunk1);
    expect(engine.getBufferedChunks()[1]).toEqual(chunk2);
  });

  it('should perform clean disposal of resources', async () => {
    let currentState = 'idle';
    engine.setCallbacks({
      onTranscript: vi.fn(),
      onError: vi.fn(),
      onStateChange: (state) => {
        currentState = state;
      },
    });

    await engine.initialize();
    await engine.startStream();
    engine.writePCM(new Float32Array([0.1, 0.2]));
    await engine.dispose();

    expect(engine.getBufferedChunks()).toHaveLength(0);
    expect(engine.getState()).toBe('idle');
  });
});
