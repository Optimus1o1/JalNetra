import { calculateOpportunity } from "@/lib/domain/rainwaterEngine";
import { computeStorageMassBalance } from "@/lib/domain/storageBalance";
import { matchNonPotableDemand } from "@/lib/domain/demandMatcher";
import { assessRechargeSuitability } from "@/lib/domain/rechargeSuitability";
import { calculateWaterCircularityScore } from "@/lib/domain/waterCircularityScore";
import { CatchmentSite } from "@/lib/domain/types";

export interface SimulationParams {
  site: CatchmentSite;
  rainfallMm: number;
  addedStorageL?: number;
  permeablePavementRatio?: number;
  demandOffsetTargetPct?: number;
}

export function runHydrologicalSimulation(params: SimulationParams) {
  const { site, rainfallMm, addedStorageL = 0 } = params;

  // 1. Calculate Opportunity
  const opportunity = calculateOpportunity(site, rainfallMm);

  // 2. Storage Mass Balance
  const effectiveCapacity = site.existingTankCapacityL + addedStorageL;
  const balance = computeStorageMassBalance({
    previousStorageL: site.currentTankStorageL,
    inflowL: opportunity.harvestableVolumeL,
    reuseWithdrawalL: site.dailyNonPotableDemandL,
    rechargeInfiltrationL: 0,
    tankCapacityL: effectiveCapacity,
  });

  // 3. Demand Match
  const demandMatch = matchNonPotableDemand(site, balance.currentStorageL);

  // 4. Recharge Suitability
  const rechargeEval = assessRechargeSuitability(site);

  // 5. Circularity Score
  const grossPrecip = rainfallMm * site.totalCatchmentAreaSqM;
  const circularity = calculateWaterCircularityScore({
    harvestRatio: grossPrecip > 0 ? opportunity.harvestableVolumeL / grossPrecip : 0,
    reuseDemandFulfillmentRatio: demandMatch.demandFulfillmentPct / 100,
    rechargeScore: rechargeEval.suitabilityClass === "EXCELLENT" ? 95 : 65,
    runoffAvoidanceRatio: grossPrecip > 0 ? Math.min(1.0, opportunity.harvestableVolumeL / grossPrecip) : 0,
  });

    return {
      opportunity,
      balance,
      demandMatch,
      rechargeEval,
      circularity,
    };
  }

import { runSimulationScenario } from "@/lib/simulationEngine";
import { SimulationScenarioRequest, SimulationScenarioResult } from "@/lib/types";
import { getPgPool } from "@/lib/db";

export async function executeAndLogSimulation(
  inputs: SimulationScenarioRequest,
  scenarioNameOverride?: string
): Promise<{ result: SimulationScenarioResult; runId: string }> {
  const result = runSimulationScenario(inputs);
  if (scenarioNameOverride) {
    result.scenarioName = scenarioNameOverride;
  }
  const runId = result.id;

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO simulation_runs (scenario_name, inputs, outcomes)
         VALUES ($1, $2, $3)`,
        [result.scenarioName, JSON.stringify(inputs), JSON.stringify(result.summary)]
      );
    } catch (err) {
      console.warn("[SimulationService] Failed to persist simulation run:", err);
    }
  }

  return { result, runId };
}

export async function getRecentSimulationRuns(limit = 5): Promise<any[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, scenario_name, created_at, inputs, outcomes
         FROM simulation_runs
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.rows;
    } catch (err) {
      console.warn("[SimulationService] Failed to fetch simulation runs:", err);
    }
  }
  return [];
}

