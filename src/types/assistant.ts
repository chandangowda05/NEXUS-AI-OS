export type NavigationTab =
  | 'dashboard'
  | 'memory'
  | 'tasks'
  | 'plugins'
  | 'files'
  | 'coding'
  | 'study'
  | 'settings'
  | 'dev';

/**
 * 9 Cognitive Core States for NEXUS AI OS:
 *  - IDLE: Standby state (Cyan pulse)
 *  - LISTENING: Microphone processing audio (Electric Blue pulse & ring expansion)
 *  - THINKING: Reasoning / prompt expansion (Deep Purple multi-ring counter-rotation)
 *  - PLANNING: DAG generation & task scheduling (Orange segmented ring sequence)
 *  - SEARCHING: Memory & web retrieval (Cyan/Amber scanning radar sweep)
 *  - EXECUTING: Dispatched process / tool execution (Red/Gold energy flow)
 *  - LEARNING: Memory consolidation & heuristic updates (Emerald Green particle convergence)
 *  - OFFLINE: Local offline model mode / offline fallback (Dark Silver static grid)
 *  - ERROR: Exception handling / permission failure (Crimson Rose warning pulse)
 */
export type CognitiveCoreState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'PLANNING'
  | 'SEARCHING'
  | 'EXECUTING'
  | 'LEARNING'
  | 'OFFLINE'
  | 'ERROR';

export interface SystemMetrics {
  cpuLoad: number; // 0-100%
  ramUsedGB: number;
  ramTotalGB: number;
  ramPercent: number;
  gpuPercent: number; // 0-100%
  diskPercent: number; // 0-100%
  cpuTempC: number; // Temperature in Celsius
  batteryPercent: number | null;
  isCharging: boolean;
  networkOnline: boolean;
  networkLatencyMs: number;
  aiStatus: CognitiveCoreState;
  micActive: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  actionCard?: {
    title: string;
    description: string;
    type: 'SUCCESS' | 'INFO' | 'WARNING' | 'EXECUTION';
    details?: string;
  };
  toolExecutionCard?: {
    toolName: string;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    progressPercent: number;
    logOutput: string;
  };
}

export interface MemoryEntry {
  id: string;
  category: 'PREFERENCE' | 'PROJECT' | 'GOAL' | 'HABIT' | 'FACT';
  key: string;
  value: string;
  confidence: number;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  category: 'SYSTEM' | 'STUDY' | 'CODING' | 'PERSONAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  category: 'AUTOMATION' | 'UTILITY' | 'AI' | 'INTEGRATION';
}

export interface UserPreferences {
  assistantName: string;
  codename: string;
  wakeWord: string;
  voiceName: string;
  voiceSpeed: number;
  personalityMode: 'PROFESSIONAL' | 'HUMOROUS' | 'CONCISE' | 'TEACHER';
  securityLevel: 'PIN' | 'PASSWORD' | 'WINDOWS_HELLO' | 'NONE';
  themeAccent: 'CYAN' | 'PURPLE' | 'EMERALD' | 'SAPPHIRE';
  soundEnabled: boolean;
  highContrast: boolean;
}
