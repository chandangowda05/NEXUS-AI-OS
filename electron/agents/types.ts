export type AgentRole = 
  | 'CONVERSATION'
  | 'PLANNING'
  | 'MEMORY'
  | 'VISION'
  | 'CODING'
  | 'RESEARCH'
  | 'AUTOMATION'
  | 'LEARNING'
  | 'SCHEDULER';

export type PermissionLevel = 'NONE' | 'READ_FILES' | 'EXECUTE_PROCESS' | 'SYSTEM_CONTROL';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'SYSTEM' | 'FILE' | 'WEB' | 'MEDIA' | 'AI' | 'SECURITY';
  requiredPermission: PermissionLevel;
  parametersSchema: Record<string, any>;
  execute: (params: any, context: ExecutionContext) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
}

export interface ExecutionContext {
  userId: string;
  sessionId: string;
  activeApp?: string;
  activeFile?: string;
  workingDirectory: string;
}

export interface AgentTaskStep {
  id: string;
  agentRole: AgentRole;
  toolName?: string;
  inputParams?: any;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export interface ExecutionDAG {
  id: string;
  userGoal: string;
  steps: AgentTaskStep[];
  currentStepIndex: number;
  isComplete: boolean;
}

export interface AgentResponse {
  agentRole: AgentRole;
  success: boolean;
  message: string;
  actionCards?: any[];
  codeSnippets?: any[];
  memoryUpdates?: any[];
  nextSuggestedActions?: string[];
}
