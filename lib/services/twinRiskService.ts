import { AlertEvent } from './alertTriageService';

export interface WardTwinRiskState {
  wardId: number;
  waterloggingRiskScore: number; // 0 to 100
  saturationPct: number;
  drainageCongestionLevel: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  estimatedTimeToWaterloggingMins: number;
  provenance: 'PREDICTED';
}

/**
 * Computes live operational risk state across wards based on telemetry and drainage constraints.
 */
export function evaluateWardTwinRisk(
  wardId: number,
  currentRainfallMmHr: number,
  riverStageM: number
): WardTwinRiskState {
  // British-era brick sewers back up when Hooghly stage exceeds 4.5m
  const tidalLockFactor = riverStageM > 4.5 ? (riverStageM - 4.5) * 40 : 0;
  const rainLoadFactor = (currentRainfallMmHr / 60) * 50;

  const riskScore = Math.min(100, Math.round(rainLoadFactor + tidalLockFactor));

  let congestionLevel: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = 'NORMAL';
  if (riskScore >= 75) congestionLevel = 'CRITICAL';
  else if (riskScore >= 40) congestionLevel = 'ELEVATED';

  const timeToWaterlog =
    riskScore >= 75
      ? Math.max(15, Math.round(180 - riskScore * 1.5))
      : Math.round(300 - riskScore * 2);

  return {
    wardId,
    waterloggingRiskScore: riskScore,
    saturationPct: Math.min(100, Math.round(riskScore * 0.95)),
    drainageCongestionLevel: congestionLevel,
    estimatedTimeToWaterloggingMins: timeToWaterlog,
    provenance: 'PREDICTED',
  };
}
