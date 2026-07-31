import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundTaskManager, IBackgroundTask } from '../services/BackgroundTaskManager';
import { BackgroundState } from '../services/BackgroundState';

describe('BackgroundTaskManager & Phase 4.4.1C Lazy Initialization', () => {
  beforeEach(() => {
    BackgroundTaskManager.resetForTest();
    vi.restoreAllMocks();
  });

  it('should handle zero registered tasks cleanly without warnings or errors', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await BackgroundTaskManager.start();

    const logs = consoleSpy.mock.calls.map((c) => c[0]);
    expect(logs).toContain('[NEXUS] Background initialization started');
    expect(logs).toContain('[NEXUS] Background initialization complete');

    const state = BackgroundState.getState();
    expect(state.isComplete).toBe(true);
    expect(state.progress).toBe(100);
    expect(state.tasks.length).toBe(0);
  });

  it('should register unique tasks and deduplicate duplicate registerTask calls', () => {
    const task: IBackgroundTask = {
      name: 'Database',
      taskLabel: 'Synchronizing Database Core...',
      dependencies: ['Storage'],
      initialize: async () => {},
    };

    BackgroundTaskManager.registerTask(task);
    BackgroundTaskManager.registerTask(task);
    BackgroundTaskManager.registerTask({ name: 'Database', initialize: async () => {} });

    const registered = BackgroundTaskManager.getRegisteredTasks();
    expect(registered.length).toBe(1);
    expect(registered[0].name).toBe('Database');
    expect(registered[0].dependencies).toEqual(['Storage']);
  });

  it('should enforce idempotent start() execution', async () => {
    let executionCount = 0;
    const task: IBackgroundTask = {
      name: 'Metrics',
      initialize: async () => {
        executionCount++;
      },
    };

    BackgroundTaskManager.registerTask(task);

    await BackgroundTaskManager.start();
    await BackgroundTaskManager.start();

    expect(executionCount).toBe(1);
  });

  it('should execute tasks sequentially, update task lifecycle statuses, and emit NEXUS logs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const executionOrder: string[] = [];

    const dbTask: IBackgroundTask = {
      name: 'Database',
      initialize: async () => {
        executionOrder.push('Database');
      },
    };

    const memoryTask: IBackgroundTask = {
      name: 'Memory',
      initialize: async () => {
        executionOrder.push('Memory');
      },
    };

    BackgroundTaskManager.registerTask(dbTask);
    BackgroundTaskManager.registerTask(memoryTask);

    await BackgroundTaskManager.start();

    expect(executionOrder).toEqual(['Database', 'Memory']);

    const logs = consoleSpy.mock.calls.map((c) => c[0]);
    expect(logs).toContain('[NEXUS] Background initialization started');
    expect(logs).toContain('[NEXUS] Starting Database');
    expect(logs).toContain('[NEXUS] Database Ready');
    expect(logs).toContain('[NEXUS] Starting Memory');
    expect(logs).toContain('[NEXUS] Memory Ready');
    expect(logs).toContain('[NEXUS] Background initialization complete');

    const state = BackgroundState.getState();
    expect(state.isComplete).toBe(true);
    expect(state.progress).toBe(100);
    expect(state.completedTasks).toEqual(['Database', 'Memory']);
  });

  it('should isolate task failures without stopping subsequent tasks or increasing progress on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const failingTask: IBackgroundTask = {
      name: 'FailingModule',
      initialize: async () => {
        throw new Error('Module load error');
      },
    };

    const healthyTask: IBackgroundTask = {
      name: 'HealthyModule',
      initialize: async () => {},
    };

    BackgroundTaskManager.registerTask(failingTask);
    BackgroundTaskManager.registerTask(healthyTask);

    await BackgroundTaskManager.start();

    const logs = consoleSpy.mock.calls.map((c) => c[0]);
    expect(logs).toContain('[NEXUS] Starting FailingModule');
    expect(logs).toContain('Continuing background initialization...');
    expect(logs).toContain('[NEXUS] Starting HealthyModule');
    expect(logs).toContain('[NEXUS] HealthyModule Ready');
    expect(logs).toContain('[NEXUS] Background initialization complete');

    const state = BackgroundState.getState();
    expect(state.failedTasks).toEqual(['FailingModule']);
    expect(state.completedTasks).toEqual(['HealthyModule']);
    expect(state.progress).toBe(50); // 1 out of 2 completed
  });
});
