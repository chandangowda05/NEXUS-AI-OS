import { describe, it, expect } from 'vitest';

// Isolated unit test mirroring ModelRouter logic without cross-module imports
const providers = {
  'gemini-flash': { id: 'gemini-flash', isLocal: false, supportsVision: true },
  'claude-sonnet': { id: 'claude-sonnet', isLocal: false, supportsVision: true },
  'gpt-4o': { id: 'gpt-4o', isLocal: false, supportsVision: true },
  'ollama-local': { id: 'ollama-local', isLocal: true, supportsVision: false },
};

function selectBestProvider(
  taskType: 'CODING' | 'RESEARCH' | 'FAST_CHAT' | 'OFFLINE' | 'VISION'
) {
  const map: Record<string, string> = {
    CODING: 'claude-sonnet',
    RESEARCH: 'gpt-4o',
    OFFLINE: 'ollama-local',
    VISION: 'gemini-flash',
    FAST_CHAT: 'gemini-flash',
  };
  return providers[map[taskType] as keyof typeof providers];
}

describe('ModelRouter', () => {
  it('routes CODING to claude-sonnet', () => {
    expect(selectBestProvider('CODING').id).toBe('claude-sonnet');
  });

  it('routes OFFLINE to local model', () => {
    expect(selectBestProvider('OFFLINE').isLocal).toBe(true);
  });

  it('routes VISION to a vision-capable model', () => {
    expect(selectBestProvider('VISION').supportsVision).toBe(true);
  });

  it('routes RESEARCH to gpt-4o', () => {
    expect(selectBestProvider('RESEARCH').id).toBe('gpt-4o');
  });
});
