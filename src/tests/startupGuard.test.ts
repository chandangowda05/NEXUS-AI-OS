import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartupGuard, IStartupService } from '../services/StartupGuard';
import { voiceService } from '../services/voiceService';
import { Sound } from '../utils/soundEffects';

describe('StartupGuard & Deterministic Bootstrap Pipeline', () => {
  beforeEach(() => {
    StartupGuard.resetForTest();
    voiceService.dispose();
    Sound.resetStartupGuardForTest();
    vi.restoreAllMocks();
  });

  it('should register unique services and ignore duplicate register() calls', () => {
    const mockService: IStartupService = {
      name: 'MockService',
      initialize: async () => {},
    };

    StartupGuard.register(mockService);
    StartupGuard.register(mockService);
    StartupGuard.register({ name: 'MockService', initialize: async () => {} });

    const registered = StartupGuard.getRegisteredServices();
    expect(registered.length).toBe(1);
    expect(registered[0].name).toBe('MockService');
  });

  it('should execute services in deterministic order', async () => {
    const sequence: string[] = [];

    const serviceA: IStartupService = {
      name: 'ServiceA',
      initialize: async () => {
        sequence.push('ServiceA');
      },
    };

    const serviceB: IStartupService = {
      name: 'ServiceB',
      initialize: async () => {
        sequence.push('ServiceB');
      },
    };

    StartupGuard.register(serviceA);
    StartupGuard.register(serviceB);

    await StartupGuard.initialize();

    expect(sequence).toEqual(['ServiceA', 'ServiceB']);
  });

  it('should never execute initialization pipeline twice', async () => {
    let initCount = 0;
    const testService: IStartupService = {
      name: 'CounterService',
      initialize: async () => {
        initCount++;
      },
    };

    StartupGuard.register(testService);

    await StartupGuard.initialize();
    await StartupGuard.initialize();

    expect(initCount).toBe(1);
  });

  it('should integrate with voiceService and produce expected NEXUS logs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    StartupGuard.register(voiceService);
    await StartupGuard.initialize();

    const logs = consoleSpy.mock.calls.map((call) => call[0]);

    expect(logs).toContain('[NEXUS] Startup initialized');
    expect(logs).toContain('[NEXUS] Voice initialized');
    expect(logs).toContain('[NEXUS] Startup sound played');
    expect(logs.some((l: string) => typeof l === 'string' && l.startsWith('[NEXUS] Startup complete'))).toBe(true);
  });
});
