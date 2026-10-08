import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { GridCell, ShapFactor } from "@/lib/types";
import { getPrismaClient, isDatabaseConnected } from "@/lib/db";

export interface CellRiskEvaluation {
  cell: GridCell;
  hazardIndex: number;
  exposureIndex: number;
  vulnerabilityIndex: number;
  compositeRiskScore: number;
  shapFactors: ShapFactor[];
  primaryDriver: string;
  recommendedIntervention: string;
}

export function computeTreeShapAttribution(cell: GridCell): ShapFactor[] {
  const elevationPenalty = Math.max(0, (6.0 - cell.elevation) / 6.0) * 0.35;
  const imperviousnessContrib = (cell.imperviousness / 100) * 0.25;
  const pondingContrib = Math.min(0.3, (cell.waterloggingDepthCm / 100) * 0.4);
  const backwaterContrib = cell.riskScore > 0.6 ? 0.15 : 0.05;

  const totalRaw = elevationPenalty + imperviousnessContrib + pondingContrib + backwaterContrib;
  const norm = totalRaw > 0 ? 1.0 / totalRaw : 1.0;

  const c1 = Math.round(pondingContrib * norm * 100);
  const c2 = Math.round(elevationPenalty * norm * 100);
  const c3 = Math.round(imperviousnessContrib * norm * 100);
  const c4 = Math.max(0, 100 - (c1 + c2 + c3));

  return [
    {
      name: "Antecedent Precipitation & Inundation",
      contribution: c1,
      direction: "increase",
      description: `Current ponding depth of ${cell.waterloggingDepthCm}cm represents saturation head above drainage threshold.`,
    },
    {
      name: "Topographic Depression (DEM Elevation)",
      contribution: c2,
      direction: "increase",
      description: `Low terrain elevation of +${cell.elevation.toFixed(1)}m MSL prevents natural gravity outfall.`,
    },
    {
      name: "Surface Imperviousness & Concrete Cover",
      contribution: c3,
      direction: "increase",
      description: `High urban sealed fraction (${cell.imperviousness}%) drastically restricts soil infiltration.`,
    },
    {
      name: "Canal Sump & Backwater Resistance",
      contribution: c4,
      direction: "increase",
      description: "Downstream canal stage elevation creates reverse hydraulic head gradient.",
    },
  ];
}

export async function getWardCellById(idOrNumber: string | number): Promise<CellRiskEvaluation | null> {
  const prisma = getPrismaClient();
  let baseCell: GridCell | undefined;

  const candidate = PILOT_GRID_CELLS.find(
    (c) => c.id === idOrNumber || String(c.wardNumber) === String(idOrNumber)
  );

  if (isDatabaseConnected() && prisma) {
    try {
      const wardNum = typeof idOrNumber === "string" ? parseInt(idOrNumber.replace(/\D/g, ""), 10) : idOrNumber;
      const wardModel = (prisma as any).wards || (prisma as any).ward;
      const dbWard = await wardModel?.findFirst({
        where: {
          OR: [
            { id: String(idOrNumber) },
            ...(isNaN(wardNum) ? [] : [{ wardNumber: wardNum }]),
          ],
        },
      });

      if (dbWard && candidate) {
        baseCell = {
          ...candidate,
          wardName: dbWard.ward_name ?? dbWard.wardName ?? candidate.wardName,
          borough: dbWard.borough ?? candidate.borough,
          elevation: dbWard.elevation_baseline_m ?? dbWard.elevationBaselineM ?? candidate.elevation,
          imperviousness: dbWard.imperviousness_pct ?? dbWard.imperviousnessPct ?? candidate.imperviousness,
          populationDensity: Math.round((dbWard.population ?? (candidate.populationDensity * 2.4)) / 2.4),
        };
      }
    } catch (err) {
      console.warn("[TwinRiskService] Ward lookup fallback to operational memory.", err);
    }
  }

  if (!baseCell) {
    baseCell = candidate;
  }

  if (!baseCell) return null;

  const shapFactors = computeTreeShapAttribution(baseCell);
  const updatedCell = { ...baseCell, shapFactors };

  const hazardIndex = Number((updatedCell.waterloggingDepthCm / 50).toFixed(2));
  const exposureIndex = Number((updatedCell.populationDensity / 60000).toFixed(2));
  const vulnerabilityIndex = Number(((updatedCell.imperviousness / 100) * (6.0 / Math.max(1, updatedCell.elevation))).toFixed(2));

  return {
    cell: updatedCell,
    hazardIndex,
    exposureIndex,
    vulnerabilityIndex,
    compositeRiskScore: updatedCell.riskScore,
    shapFactors,
    primaryDriver: shapFactors[0].name,
    recommendedIntervention:
      updatedCell.riskScore >= 0.75
        ? "Deploy mobile heavy-duty diesel turbines & activate upstream sluice bypass gates."
        : "Maintain standard municipal sump desilting schedule and monitor GPM nowcast.",
  };
}

export async function getAllWardCells(): Promise<GridCell[]> {
  return PILOT_GRID_CELLS.map((cell) => ({
    ...cell,
    shapFactors: computeTreeShapAttribution(cell),
  }));
}

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
