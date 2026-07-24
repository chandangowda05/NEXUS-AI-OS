import { getDb } from '../services/db';

export interface MemoryFact {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
}

export class MemoryAgent {
  private workingMemory: Map<string, any> = new Map();

  public setWorkingMemory(key: string, value: any) {
    this.workingMemory.set(key, value);
  }

  public getWorkingMemory(key: string): any {
    return this.workingMemory.get(key);
  }

  public async getRelevantContext(query: string): Promise<MemoryFact[]> {
    const db = getDb();
    if (!db) return [];
    try {
      const stmt = db.prepare('SELECT id, category, key, value, confidence FROM memories LIMIT 10');
      const rows = stmt.all() as MemoryFact[];
      return rows.filter(r => r.key.toLowerCase().includes(query.toLowerCase()) || r.value.toLowerCase().includes(query.toLowerCase()));
    } catch (err) {
      console.error('[MemoryAgent] Failed to query memories:', err);
      return [];
    }
  }

  public async saveFact(category: string, key: string, value: string): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    try {
      const stmt = db.prepare(`
        INSERT INTO memories (id, category, key, value, confidence)
        VALUES (?, ?, ?, ?, 1.0)
        ON CONFLICT(id) DO UPDATE SET value=excluded.value
      `);
      stmt.run(`mem-${Date.now()}`, category, key, value);
      return true;
    } catch (err) {
      console.error('[MemoryAgent] Failed to save fact:', err);
      return false;
    }
  }
}

export const memoryAgent = new MemoryAgent();
