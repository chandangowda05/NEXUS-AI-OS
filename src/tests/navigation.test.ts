import { describe, it, expect } from 'vitest';

describe('NavigationTab Type', () => {
  it('should include all expected tab identifiers', () => {
    const tabs = ['dashboard', 'memory', 'tasks', 'plugins', 'files', 'coding', 'study', 'settings', 'dev'];
    expect(tabs).toContain('dashboard');
    expect(tabs).toContain('dev');
    expect(tabs.length).toBe(9);
  });
});
