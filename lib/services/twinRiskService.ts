import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { GridCell } from "@/lib/types";

export interface RiskEvaluationRequest {
  wardNumber: number;
  simulatedRainfallMm: number;
  tidalStageM: number;
  pumpingCapacityMultiplier?: number;
  desiltingFactor?: number;
}

export function evaluateWardRisk(req: RiskEvaluationRequest): {
  wardNumber: number;
  riskScore: number;
  inundationDepthCm: number;
  criticality: "NORMAL" | "ELEVATED" | "CRITICAL";
  dominantFactor: string;
} {
  const cell = PILOT_GRID_CELLS.find((c) => c.wardNumber === req.wardNumber) || PILOT_GRID_CELLS[0];
  const { simulatedRainfallMm, tidalStageM, pumpingCapacityMultiplier = 1.0, desiltingFactor = 1.0 } = req;

  // Elevation vulnerability
  const elevVulnerability = Math.max(0, (7.0 - cell.elevation) / 4.0);

  // Tidal Lockout factor (if tidal stage > 4.5m MSL)
  const tidalLock = tidalStageM > 4.5 ? ((tidalStageM - 4.5) / 1.5) * 0.45 : 0;

  // Rain load factor
  const rainLoad = (simulatedRainfallMm / 100.0) * 0.55;

  // Mitigation relief
  const pumpRelief = (pumpingCapacityMultiplier - 1.0) * 0.15;
  const desiltRelief = (desiltingFactor - 1.0) * 0.12;

  let rawScore = (elevVulnerability * 0.4) + rainLoad + tidalLock - pumpRelief - desiltRelief;
  rawScore = Math.max(0.05, Math.min(0.98, rawScore));

  const inundationDepthCm = Math.round(rawScore * 48);

  let criticality: "NORMAL" | "ELEVATED" | "CRITICAL" = "NORMAL";
  if (rawScore >= 0.75) criticality = "CRITICAL";
  else if (rawScore >= 0.45) criticality = "ELEVATED";

  let dominantFactor = "Standard Gravity Drainage";
  if (tidalLock > 0.25) dominantFactor = "Hooghly River High-Tide Outfall Lockup";
  else if (rainLoad > 0.4) dominantFactor = "Convective Cloudburst Intensity";
  else if (elevVulnerability > 0.6) dominantFactor = "Low Elevation Basin Depression";

  return {
    wardNumber: req.wardNumber,
    riskScore: Number(rawScore.toFixed(3)),
    inundationDepthCm,
    criticality,
    dominantFactor,
  };
}
