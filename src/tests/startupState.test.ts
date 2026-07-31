import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartupState } from '../services/StartupState';
import { StartupGuard, IStartupService } from '../services/StartupGuard';
import { voiceService } from '../services/voiceService';
import { Sound } from '../utils/soundEffects';

describe('StartupState & Phase 4.4.1B Professional Startup Experience', () => {
  beforeEach(() => {
    StartupState.resetForTest();
    StartupGuard.resetForTest();
    voiceService.dispose();
    Sound.resetStartupGuardForTest();
    vi.restoreAllMocks();
  });

  it('should initialize with default 0% state and task label', () => {
    const state = StartupState.getState();
    expect(state.progress).toBe(0);
    expect(state.currentTask).toBe('Initializing NEXUS...');
    expect(state.isComplete).toBe(false);
  });

  it('should update progress monotonically and ignore backwards progress jumps', () => {
    StartupState.updateProgress(30, 'Step 1');
    expect(StartupState.getState().progress).toBe(30);

    // Attempting to jump backwards to 15% should be ignored by monotonic guard
    StartupState.updateProgress(15, 'Backwards step');
    expect(StartupState.getState().progress).toBe(30);

    StartupState.updateProgress(75, 'Step 2');
    expect(StartupState.getState().progress).toBe(75);
  });

  it('should notify subscribers reactively on state updates', () => {
    const listener = vi.fn();
    const unsub = StartupState.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);

    StartupState.updateProgress(50, 'Loading Engine...');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ progress: 50, currentTask: 'Loading Engine...' })
    );

    unsub();
  });

  it('should mark startup complete with duration', () => {
    StartupState.markComplete(842);
    const state = StartupState.getState();

    expect(state.progress).toBe(100);
    expect(state.isComplete).toBe(true);
    expect(state.durationMs).toBe(842);
    expect(state.currentTask).toBe('Ready');
  });

  it('should execute StartupGuard pipeline and emit exact NEXUS logs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockWhisperService: IStartupService = {
      name: 'Whisper',
      taskLabel: 'Loading Whisper STT Engine...',
      initialize: async () => {},
    };

    StartupGuard.register(voiceService);
    StartupGuard.register(mockWhisperService);

    await StartupGuard.initialize();

    const logs = consoleSpy.mock.calls.map((call) => call[0]);

    expect(logs).toContain('[NEXUS] Startup initialized');
    expect(logs).toContain('[NEXUS] Splash screen shown');
    expect(logs).toContain('[NEXUS] Loading Voice');
    expect(logs).toContain('[NEXUS] Loading Whisper');
    expect(logs.some((l: string) => typeof l === 'string' && l.startsWith('[NEXUS] Startup complete'))).toBe(true);

    const state = StartupState.getState();
    expect(state.isComplete).toBe(true);
    expect(state.progress).toBe(100);
  });
});
