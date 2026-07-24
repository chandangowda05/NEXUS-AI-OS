import { eventBus } from './EventBus';
import { Logger } from '../utils/Logger';

const MODULE = 'CognitiveEngine';
export interface DecisionParams {
  confidenceScore: number;
  goalPriorityWeight: number; // 0.0 - 1.0
  securityRiskLevel: number;   // 0.0 - 1.0
  batteryLevel: number;        // 0.0 - 1.0
}

export class CognitiveEngine {
  public evaluateDecision(params: DecisionParams): { approved: boolean; score: number; reason: string } {
    const { confidenceScore, goalPriorityWeight, securityRiskLevel, batteryLevel } = params;

    // Weighted Formula:
    // Score = (Confidence * 0.35) + (Priority * 0.25) - (Risk * 0.30) + (Battery * 0.10)
    const score = Number(((confidenceScore * 0.35) + (goalPriorityWeight * 0.25) - (securityRiskLevel * 0.30) + (batteryLevel * 0.10)).toFixed(2));

    const approved = score >= 0.35 && securityRiskLevel <= 0.85;
    const reason = approved 
      ? `Decision approved with confidence score ${score}`
      : `Execution rejected due to high risk (${securityRiskLevel}) or low score (${score})`;

    eventBus.publish('COGNITIVE_DECISION', { approved, score, reason, params }, approved ? 'MEDIUM' : 'HIGH');
    Logger.info(MODULE, `Decision evaluated — approved=${approved} score=${score}`, { reason });

    return { approved, score, reason };
  }
}

export const cognitiveEngine = new CognitiveEngine();
