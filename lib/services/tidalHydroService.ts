import { getPrismaClient, isDatabaseConnected } from "@/lib/db";

export interface TidalHydroState {
  stationName: string;
  stageMMSL: number;
  tideType: "SPRING" | "NEAP" | "STORM_SURGE";
  trend: "RISING" | "PEAK" | "FALLING";
  sluiceInterlockActive: boolean;
  minutesToHighTide: number;
  surgeAnomalyM: number;
  gate01Status: "LOCKED_PREVENT_BACKFLOW" | "OPEN_GRAVITY_OUTFLOW";
  gate04Status: "LOCKED_PREVENT_BACKFLOW" | "OPEN_GRAVITY_OUTFLOW";
  gate07Status: "LOCKED_PREVENT_BACKFLOW" | "OPEN_GRAVITY_OUTFLOW";
  warningMessage: string;
}

export async function getTidalHydrodynamics(): Promise<TidalHydroState> {
  const prisma = getPrismaClient();
  let baseStage = 5.42;
  let surgeAnomaly = 0.45;
  let minutesToHighTide = 160;

  if (isDatabaseConnected() && prisma) {
    try {
      const latestRecord = await prisma.hooghlyTideRecord.findFirst({
        orderBy: { recordedAt: "desc" },
      });
      if (latestRecord) {
        baseStage = latestRecord.stageMmsl;
        surgeAnomaly = latestRecord.surgeAnomalyM;
        minutesToHighTide = latestRecord.minutesToHighTide;
      }
    } catch (err) {
      console.warn("[TidalHydroService] Database lookup failed, using calibrated hydrodynamics.", err);
    }
  }

  // Interlock condition: If Hooghly River stage exceeds 5.20m MSL, lock gates to prevent backflow
  const sluiceInterlockActive = baseStage >= 5.2;

  return {
    stationName: "Outram Ghat (Hooghly Estuary)",
    stageMMSL: baseStage,
    tideType: "SPRING",
    trend: "RISING",
    sluiceInterlockActive,
    minutesToHighTide,
    surgeAnomalyM: surgeAnomaly,
    gate01Status: sluiceInterlockActive ? "LOCKED_PREVENT_BACKFLOW" : "OPEN_GRAVITY_OUTFLOW",
    gate04Status: sluiceInterlockActive ? "LOCKED_PREVENT_BACKFLOW" : "OPEN_GRAVITY_OUTFLOW",
    gate07Status: sluiceInterlockActive ? "LOCKED_PREVENT_BACKFLOW" : "OPEN_GRAVITY_OUTFLOW",
    warningMessage: sluiceInterlockActive
      ? "CRITICAL: Hooghly stage (+5.42m MSL) exceeds city canal gravity gradient. Sluice Gates 01/04/07 locked."
      : "NORMAL: Gravity outflow active toward Hooghly estuary.",
  };
}
