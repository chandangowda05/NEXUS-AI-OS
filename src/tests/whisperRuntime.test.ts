import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhisperRuntime } from '../voice/engines/WhisperRuntime';
import { WhisperEngine } from '../voice/engines/WhisperEngine';
import { modelManager } from '../voice/models/ModelManager';

describe('WhisperRuntime Unit Tests', () => {
  let runtime: WhisperRuntime;

  beforeEach(() => {
    runtime = new WhisperRuntime();
  });

  it('should initialize with status uninitialized', () => {
    expect(runtime.getStatus()).toBe('uninitialized');
    expect(runtime.isReady()).toBe(false);
    expect(runtime.getCurrentModelId()).toBeNull();
    expect(runtime.getSession()).toBeNull();
  });

  it('should successfully initialize and load valid model whisper-tiny.en', async () => {
    await runtime.initialize('whisper-tiny.en');
    expect(runtime.getStatus()).toBe('ready');
    expect(runtime.isReady()).toBe(true);
    expect(runtime.getCurrentModelId()).toBe('whisper-tiny.en');
    expect(runtime.getSession()).not.toBeNull();
    expect(runtime.getSession()?.version).toBe('tiny.en');
  });

  it('should transition status from loading to ready during successful initialization', async () => {
    const statusSequence: string[] = [];
    statusSequence.push(runtime.getStatus());

    const initPromise = runtime.initialize('whisper-tiny.en');
    statusSequence.push(runtime.getStatus()); // 'loading'

    await initPromise;
    statusSequence.push(runtime.getStatus()); // 'ready'

    expect(statusSequence).toEqual(['uninitialized', 'loading', 'ready']);
  });

  it('should fail gracefully and set status to failed for non-existent model', async () => {
    await expect(runtime.initialize('non-existent-model')).rejects.toThrow();
    expect(runtime.getStatus()).toBe('failed');
    expect(runtime.isReady()).toBe(false);
    expect(runtime.getCurrentModelId()).toBeNull();
    expect(runtime.getSession()).toBeNull();
  });

  it('should handle un-downloaded model failure correctly', async () => {
    await expect(runtime.initialize('whisper-base.en')).rejects.toThrow();
    expect(runtime.getStatus()).toBe('failed');
  });

  it('should dispose runtime cleanly and reset state', async () => {
    await runtime.initialize('whisper-tiny.en');
    expect(runtime.isReady()).toBe(true);

    await runtime.dispose();
    expect(runtime.getStatus()).toBe('uninitialized');
    expect(runtime.isReady()).toBe(false);
    expect(runtime.getSession()).toBeNull();
  });

  it('should integrate with WhisperEngine initialize lifecycle', async () => {
    const engine = new WhisperEngine(runtime);
    expect(engine.getRuntimeStatus()).toBe('uninitialized');

    await engine.initialize();
    expect(engine.getRuntimeStatus()).toBe('ready');
    expect(engine.getState()).toBe('idle');

    await engine.dispose();
    expect(engine.getRuntimeStatus()).toBe('uninitialized');
  });

  it('should emit error callback through WhisperEngine on model initialization failure', async () => {
    const engine = new WhisperEngine(runtime);
    const onError = vi.fn();
    engine.setCallbacks({
      onTranscript: vi.fn(),
      onError,
      onStateChange: vi.fn(),
    });

    // Temporarily set active model to an invalid model ID
    vi.spyOn(modelManager, 'getActiveModel').mockReturnValueOnce({
      id: 'invalid-model',
      name: 'Invalid Model',
      language: 'en',
      sizeBytes: 0,
      size: '0MB',
      url: '',
      downloadStatus: false,
      isDownloaded: false,
      version: '',
      cacheDir: '',
    });

    await engine.initialize();
    expect(engine.getState()).toBe('error');
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Whisper runtime initialization failed'),
      'runtime_init_failed'
    );
  });
});
