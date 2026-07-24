import { AgentResponse, ExecutionDAG, AgentTaskStep } from './types';

export class PlanningAgent {
  public createPlan(userGoal: string): ExecutionDAG {
    const goalLower = userGoal.toLowerCase();
    const steps: AgentTaskStep[] = [];

    if (goalLower.includes('launch') || goalLower.includes('open')) {
      steps.push({
        id: 'step-1',
        agentRole: 'AUTOMATION',
        toolName: 'tool_launch_app',
        inputParams: { appName: userGoal.replace(/launch|open/gi, '').trim() },
        status: 'PENDING'
      });
    } else if (goalLower.includes('search') || goalLower.includes('file')) {
      steps.push({
        id: 'step-1',
        agentRole: 'AUTOMATION',
        toolName: 'tool_search_files',
        inputParams: { query: 'src' },
        status: 'PENDING'
      });
    } else if (goalLower.includes('code') || goalLower.includes('bug')) {
      steps.push({
        id: 'step-1',
        agentRole: 'CODING',
        inputParams: { prompt: userGoal },
        status: 'PENDING'
      });
    } else {
      steps.push({
        id: 'step-1',
        agentRole: 'CONVERSATION',
        inputParams: { text: userGoal },
        status: 'PENDING'
      });
    }

    return {
      id: `dag-${Date.now()}`,
      userGoal,
      steps,
      currentStepIndex: 0,
      isComplete: false
    };
  }

  public revisePlanOnError(dag: ExecutionDAG, failedStepIndex: number, error: string): ExecutionDAG {
    console.warn(`[PlanningAgent] Step ${failedStepIndex} failed: ${error}. Revising DAG...`);
    dag.steps[failedStepIndex].status = 'FAILED';
    // Add fallback diagnostic step
    dag.steps.push({
      id: `step-fallback-${Date.now()}`,
      agentRole: 'CONVERSATION',
      inputParams: { text: `Encountered issue: ${error}. Suggesting alternative action.` },
      status: 'PENDING'
    });
    return dag;
  }
}

export const planningAgent = new PlanningAgent();
