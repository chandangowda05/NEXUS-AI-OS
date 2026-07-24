import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface DbStore {
  preferences: Record<string, string>;
  memories: Array<{ id: string; category: string; key: string; value: string; confidence: number; updated_at: string }>;
  tasks: Array<{ id: string; title: string; category: string; status: string; priority: string; created_at: string }>;
  plugins: Array<{ id: string; name: string; version: string; author: string; description: string; enabled: number; category: string }>;
  conversation_history: Array<{ id: string; sender: string; content: string; timestamp: string }>;
  semantic_memories: Array<{ id: string; content: string; category: string; importance_score: number; created_at: string }>;
  graph_nodes: Array<{ id: string; label: string; type: string; properties: string }>;
  graph_edges: Array<{ source_id: string; target_id: string; relation: string; weight: number }>;
  security_audit_logs: Array<{ id: string; agent_id: string; tool_name: string; parameters: string; permission_status: string; timestamp: string }>;
}

let store: DbStore = {
  preferences: {},
  memories: [],
  tasks: [],
  plugins: [],
  conversation_history: [],
  semantic_memories: [],
  graph_nodes: [],
  graph_edges: [],
  security_audit_logs: []
};

let dbFilePath = '';

export function initDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    dbFilePath = path.join(userDataPath, 'nexus_store.json');

    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf-8');
      store = { ...store, ...JSON.parse(data) };
    } else {
      // Seed default preferences
      store.preferences = {
        assistantName: 'NEXUS',
        codename: 'Project Phoenix',
        wakeWord: 'Hey Nexus',
        voiceName: 'Natural Holographic',
        personalityMode: 'HUMOROUS'
      };

      // Seed default memories
      store.memories = [
        { id: 'mem-1', category: 'GOAL', key: 'Primary Objective', value: 'Build world-class AI Assistant (Project Phoenix)', confidence: 1.0, updated_at: new Date().toISOString() },
        { id: 'mem-2', category: 'PREFERENCE', key: 'Design Aesthetic', value: 'Obsidian dark, cyan glowing glassmorphic interface', confidence: 1.0, updated_at: new Date().toISOString() },
        { id: 'mem-3', category: 'PROJECT', key: 'Active Repository', value: 'g:/jarvis', confidence: 1.0, updated_at: new Date().toISOString() }
      ];

      // Seed default tasks
      store.tasks = [
        { id: 'task-1', title: 'Initialize Multi-Agent Core Engine', category: 'SYSTEM', status: 'IN_PROGRESS', priority: 'HIGH', created_at: new Date().toISOString() },
        { id: 'task-2', title: 'Configure Windows Native System Controls', category: 'SYSTEM', status: 'PENDING', priority: 'HIGH', created_at: new Date().toISOString() }
      ];

      saveStore();
    }

    console.log('[Database] File persistence initialized at:', dbFilePath);
  } catch (error) {
    console.error('[Database] Initialization error:', error);
  }
}

export function saveStore() {
  if (!dbFilePath) return;
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to save store:', err);
  }
}

export function getDbStore(): DbStore {
  return store;
}

export function getDb() {
  return {
    prepare: (query: string) => {
      const queryLower = query.toLowerCase();
      return {
        all: () => {
          if (queryLower.includes('from memories')) return store.memories;
          if (queryLower.includes('from tasks')) return store.tasks;
          if (queryLower.includes('from plugins')) return store.plugins;
          if (queryLower.includes('from preferences')) return Object.entries(store.preferences).map(([k, v]) => ({ key: k, value: v }));
          return [];
        },
        get: () => {
          if (queryLower.includes('count(*)')) return { count: store.memories.length };
          return null;
        },
        run: (...args: any[]) => {
          if (queryLower.includes('insert into memories')) {
            store.memories.push({ id: args[0] || `mem-${Date.now()}`, category: args[1], key: args[2], value: args[3], confidence: args[4] || 1.0, updated_at: new Date().toISOString() });
          } else if (queryLower.includes('insert into security_audit_logs')) {
            store.security_audit_logs.push({ id: args[0], agent_id: args[1], tool_name: args[2], parameters: args[3], permission_status: args[4], timestamp: new Date().toISOString() });
          } else if (queryLower.includes('insert into preferences')) {
            store.preferences[args[0]] = args[1];
          }
          saveStore();
          return { changes: 1 };
        }
      };
    }
  };
}
