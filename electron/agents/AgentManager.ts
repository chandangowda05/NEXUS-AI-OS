import { planningAgent } from './PlanningAgent';
import { memoryAgent } from './MemoryAgent';
import { toolManager } from '../services/toolManager';
import { AgentResponse, ExecutionContext } from './types';

export class AgentManager {
  public async handleUserRequest(userPrompt: string, context: ExecutionContext): Promise<AgentResponse> {
    console.log(`[AgentManager] Received request: "${userPrompt}"`);

    // 1. Memory Context Enrichment
    const memoryFacts = await memoryAgent.getRelevantContext(userPrompt);
    memoryAgent.setWorkingMemory('activePrompt', userPrompt);

    // 2. Planning Agent creates Execution DAG
    const dag = planningAgent.createPlan(userPrompt);

    const actionCards: any[] = [];
    let aggregatedMessage = '';

    // 3. Execute DAG steps
    for (let i = 0; i < dag.steps.length; i++) {
      const step = dag.steps[i];
      step.status = 'RUNNING';

      if (step.toolName) {
        const toolResult = await toolManager.executeTool(step.toolName, step.inputParams, context);

        if (toolResult.success) {
          step.status = 'COMPLETED';
          step.result = toolResult.data;

          actionCards.push({
            title: `Executed: ${step.toolName}`,
            description: typeof toolResult.data === 'string' ? toolResult.data : JSON.stringify(toolResult.data),
            type: 'SUCCESS',
            details: `${toolResult.executionTimeMs}ms`
          });
          aggregatedMessage += `Successfully executed ${step.toolName}. `;
        } else {
          step.status = 'FAILED';
          planningAgent.revisePlanOnError(dag, i, toolResult.error || 'Unknown tool failure');
          actionCards.push({
            title: `Execution Failed: ${step.toolName}`,
            description: toolResult.error || 'Permission or execution error',
            type: 'WARNING',
            details: 'ERROR'
          });
          aggregatedMessage += `Action ${step.toolName} failed: ${toolResult.error}. `;
        }
      } else {
        step.status = 'COMPLETED';
        aggregatedMessage += `I am processing your query: "${userPrompt}". `;
      }
    }

    // 4. Return merged response
    return {
      agentRole: 'CONVERSATION',
      success: true,
      message: aggregatedMessage || `Processed request: "${userPrompt}"`,
      actionCards
    };
  }
}

export const agentManager = new AgentManager();
