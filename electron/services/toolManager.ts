import { ToolDefinition, ToolResult, ExecutionContext, PermissionLevel } from '../agents/types';
import { getDb } from './db';
import { executeDesktopCommand } from './desktopControl';
import fs from 'fs';
import path from 'path';

class ToolManager {
  private tools: Map<string, ToolDefinition> = new Map();
  private userPermissions: Set<PermissionLevel> = new Set(['NONE', 'READ_FILES', 'EXECUTE_PROCESS', 'SYSTEM_CONTROL']);

  constructor() {
    this.registerBuiltInTools();
  }

  public registerTool(tool: ToolDefinition) {
    this.tools.set(tool.id, tool);
    console.log(`[ToolManager] Registered tool: ${tool.name} (${tool.id})`);
  }

  public getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(toolId: string, params: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolId);

    if (!tool) {
      this.logAudit(toolId, params, 'REJECTED_UNKNOWN_TOOL');
      return {
        success: false,
        error: `Tool with ID '${toolId}' not found.`,
        executionTimeMs: Date.now() - startTime
      };
    }

    // Security Permission Check
    if (!this.userPermissions.has(tool.requiredPermission)) {
      this.logAudit(toolId, params, 'REJECTED_INSUFFICIENT_PERMISSIONS');
      return {
        success: false,
        error: `Permission '${tool.requiredPermission}' is required to run '${tool.name}'.`,
        executionTimeMs: Date.now() - startTime
      };
    }

    try {
      const result = await tool.execute(params, context);
      const executionTimeMs = Date.now() - startTime;
      this.logAudit(toolId, params, 'GRANTED');
      return { ...result, executionTimeMs };
    } catch (err: any) {
      this.logAudit(toolId, params, 'FAILED_EXECUTION');
      return {
        success: false,
        error: err.message || 'Tool execution encountered an error.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  private logAudit(toolId: string, params: any, status: string) {
    const db = getDb();
    if (!db) return;
    try {
      const stmt = db.prepare(`
        INSERT INTO security_audit_logs (id, agent_id, tool_name, parameters, permission_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(`audit-${Date.now()}`, 'AGENT_ORCHESTRATOR', toolId, JSON.stringify(params), status);
    } catch (err) {
      console.error('[ToolManager] Failed to record audit log:', err);
    }
  }

  private registerBuiltInTools() {
    // 1. Tool_LaunchApp
    this.registerTool({
      id: 'tool_launch_app',
      name: 'Launch Application',
      description: 'Launches Windows desktop applications (VS Code, Chrome, Spotify, etc.)',
      category: 'SYSTEM',
      requiredPermission: 'EXECUTE_PROCESS',
      parametersSchema: { appName: 'string' },
      execute: async (params) => {
        const res = await executeDesktopCommand('LAUNCH_APP', { appName: params.appName });
        return { success: res.success, data: res.message, executionTimeMs: 0 };
      }
    });

    // 2. Tool_SearchFiles
    this.registerTool({
      id: 'tool_search_files',
      name: 'Search Files',
      description: 'Indexes and searches files in working directory',
      category: 'FILE',
      requiredPermission: 'READ_FILES',
      parametersSchema: { query: 'string', searchPath: 'string' },
      execute: async (params, context) => {
        const dir = params.searchPath || context.workingDirectory || 'g:/jarvis';
        try {
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const matched = files.filter(f => f.toLowerCase().includes((params.query || '').toLowerCase()));
            return { success: true, data: matched, executionTimeMs: 0 };
          }
          return { success: false, error: 'Path does not exist', executionTimeMs: 0 };
        } catch (e: any) {
          return { success: false, error: e.message, executionTimeMs: 0 };
        }
      }
    });

    // 3. Tool_GetStorageInfo
    this.registerTool({
      id: 'tool_get_storage',
      name: 'Get Storage Telemetry',
      description: 'Queries Windows drive storage free space and utilization',
      category: 'SYSTEM',
      requiredPermission: 'SYSTEM_CONTROL',
      parametersSchema: {},
      execute: async () => {
        const res = await executeDesktopCommand('GET_STORAGE_INFO');
        return { success: res.success, data: res.data, executionTimeMs: 0 };
      }
    });
  }
}

export const toolManager = new ToolManager();
