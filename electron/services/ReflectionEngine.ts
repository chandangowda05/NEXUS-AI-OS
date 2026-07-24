import { eventBus } from './EventBus';
import { getDb } from './db';

export interface ExecutionReflection {
  taskId: string;
  success: boolean;
  toolUsed?: string;
  latencyMs: number;
  confidenceOutput: number;
  diagnosticNotes: string;
}

export class ReflectionEngine {
  public reflectOnExecution(reflection: ExecutionReflection) {
    console.log(`[ReflectionEngine] Evaluating task ${reflection.taskId}: ${reflection.success ? 'SUCCESS' : 'FAILED'}`);

    eventBus.publish('EXECUTION_REFLECTION', reflection, reflection.success ? 'LOW' : 'HIGH');

    // Update memory heuristics in database
    const db = getDb();
    if (db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO memories (id, category, key, value, confidence)
          VALUES (?, 'REFLECTION', ?, ?, ?)
        `);
        stmt.run(
          `reflect-${Date.now()}`,
          `Task Execution [${reflection.taskId}]`,
          JSON.stringify({ tool: reflection.toolUsed, notes: reflection.diagnosticNotes, latency: reflection.latencyMs }),
          reflection.confidenceOutput
        );
      } catch (err) {
        console.error('[ReflectionEngine] Failed to save reflection log:', err);
      }
    }
  }
}

export const reflectionEngine = new ReflectionEngine();
