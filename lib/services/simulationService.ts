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
    runoffMitigationScore: grossPrecip > 0 ? (grossPrecip - opportunity.unmitigatedRunoffL) / grossPrecip * 100 : 0,
  });

  return {
    opportunity,
    balance,
    demandMatch,
    rechargeEval,
    circularity,
  };
}
