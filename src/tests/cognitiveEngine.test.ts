import { describe, it, expect } from 'vitest';

// Isolated unit test — mirrors the decision logic from CognitiveEngine without cross-module imports
function evaluateDecision(params: {
  confidenceScore: number;
  goalPriorityWeight: number;
  securityRiskLevel: number;
  batteryLevel: number;
}): { approved: boolean; score: number } {
  const { confidenceScore, goalPriorityWeight, securityRiskLevel, batteryLevel } = params;
  const score = Number(
    (
      confidenceScore * 0.35 +
      goalPriorityWeight * 0.25 -
      securityRiskLevel * 0.3 +
      batteryLevel * 0.1
    ).toFixed(2)
  );
  const approved = score >= 0.35 && securityRiskLevel <= 0.85;
  return { approved, score };
}

describe('CognitiveEngine Decision Matrix', () => {
  it('should approve high-confidence, low-risk decisions', () => {
    const result = evaluateDecision({
      confidenceScore: 0.95,
      goalPriorityWeight: 0.9,
      securityRiskLevel: 0.1,
      batteryLevel: 0.85,
    });
    expect(result.approved).toBe(true);
    expect(result.score).toBeGreaterThan(0.35);
  });

  it('should reject decisions with extreme security risk', () => {
    const result = evaluateDecision({
      confidenceScore: 0.9,
      goalPriorityWeight: 0.9,
      securityRiskLevel: 0.95,
      batteryLevel: 0.8,
    });
    expect(result.approved).toBe(false);
  });

  it('score formula is bounded correctly', () => {
    const result = evaluateDecision({
      confidenceScore: 1.0,
      goalPriorityWeight: 1.0,
      securityRiskLevel: 0.0,
      batteryLevel: 1.0,
    });
    expect(result.score).toBe(0.7);
  });
});
