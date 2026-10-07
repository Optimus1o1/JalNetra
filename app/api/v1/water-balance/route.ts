import { NextRequest, NextResponse } from "next/server";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { calculateHarvestableVolume } from "@/lib/domain/rainwaterEngine";
import { computeStorageMassBalance } from "@/lib/domain/storageBalance";
import { matchNonPotableDemand } from "@/lib/domain/demandMatcher";
import { assessRechargeSuitability } from "@/lib/domain/rechargeSuitability";
import { calculateWaterCircularityScore } from "@/lib/domain/waterCircularityScore";
import { clampNumber } from "@/lib/security/sanitize";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rainfallParam = searchParams.get("rainfall");
  const rainfallMm = clampNumber(rainfallParam ? parseFloat(rainfallParam) : 55.0, 0, 500, 55.0);

  let totalGrossRainL = 0;
  let totalCapturedL = 0;
  let totalReusedL = 0;
  let totalRechargedL = 0;
  let totalOverflowL = 0;
  let totalStorageL = 0;
  let totalCapacityL = 0;
  let totalDemandL = 0;

  const siteBalances = KMC_CATCHMENT_SITES.map((site) => {
    const opp = calculateHarvestableVolume(site, rainfallMm);
    const grossPrecip = rainfallMm * site.totalCatchmentAreaSqM;
    totalGrossRainL += grossPrecip;

    const rechargeEval = assessRechargeSuitability(site);
    const balance = computeStorageMassBalance({
      previousStorageL: site.currentTankStorageL,
      inflowL: opp.harvestableVolumeL,
      reuseWithdrawalL: site.dailyNonPotableDemandL,
      rechargeInfiltrationL: rechargeEval.maxDailyRechargeCapacityL * 0.4,
      tankCapacityL: site.existingTankCapacityL,
    });

    const demandMatch = matchNonPotableDemand(site, balance.currentStorageL);

    totalCapturedL += balance.inflowL;
    totalReusedL += demandMatch.waterSuppliedFromHarvestL;
    totalRechargedL += balance.rechargeInfiltrationL;
    totalOverflowL += balance.overflowL;
    totalStorageL += balance.currentStorageL;
    totalCapacityL += balance.tankCapacityL;
    totalDemandL += site.dailyNonPotableDemandL;

    return {
      siteId: site.id,
      siteName: site.siteName,
      wardNumber: site.wardNumber,
      storageBalance: balance,
      demandMatch,
      rechargeEval,
    };
  });

  const unmitigatedRunoffL = Math.max(0, totalGrossRainL - totalCapturedL);
  const avoidedRunoffRatio = totalGrossRainL > 0 ? (totalCapturedL + totalRechargedL) / totalGrossRainL : 0;
  const harvestRatio = totalGrossRainL > 0 ? totalCapturedL / totalGrossRainL : 0;
  const demandRatio = totalDemandL > 0 ? totalReusedL / totalDemandL : 0;

  const circularityScore = calculateWaterCircularityScore({
    harvestRatio,
    reuseDemandFulfillmentRatio: demandRatio,
    rechargeScore: 68,
    runoffAvoidanceRatio: avoidedRunoffRatio,
  });

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    eventRainfallMm: rainfallMm,
    summary: {
      totalGrossRainfallML: Number((totalGrossRainL / 1_000_000).toFixed(3)),
      totalCapturedML: Number((totalCapturedL / 1_000_000).toFixed(3)),
      totalReusedML: Number((totalReusedL / 1_000_000).toFixed(3)),
      totalRechargedML: Number((totalRechargedL / 1_000_000).toFixed(3)),
      totalTankStorageML: Number((totalStorageL / 1_000_000).toFixed(3)),
      totalTankCapacityML: Number((totalCapacityL / 1_000_000).toFixed(3)),
      totalOverflowML: Number((totalOverflowL / 1_000_000).toFixed(3)),
      unmitigatedRunoffML: Number((unmitigatedRunoffL / 1_000_000).toFixed(3)),
      runoffInterceptionPct: Number((avoidedRunoffRatio * 100).toFixed(1)),
    },
    circularityScore,
    siteCount: siteBalances.length,
    siteBalances,
    provenance: "SIMULATED",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rainfallMm = clampNumber(body.rainfallMm, 0, 500, 50);
    const roofAreaSqM = clampNumber(body.roofAreaSqM, 10, 500000, 1000);
    const runoffCoeff = clampNumber(body.runoffCoefficient, 0.1, 1.0, 0.85);
    const tankCapacityL = clampNumber(body.tankCapacityL, 500, 10000000, 25000);
    const dailyDemandL = clampNumber(body.dailyDemandL, 100, 5000000, 5000);
    const currentStorageL = clampNumber(body.currentStorageL, 0, tankCapacityL, 5000);

    const harvestL = Math.round(rainfallMm * roofAreaSqM * runoffCoeff * 0.85);
    const balance = computeStorageMassBalance({
      previousStorageL: currentStorageL,
      inflowL: harvestL,
      reuseWithdrawalL: dailyDemandL,
      rechargeInfiltrationL: 0,
      tankCapacityL,
    });

    return NextResponse.json({
      status: "success",
      inputs: { rainfallMm, roofAreaSqM, runoffCoeff, tankCapacityL, dailyDemandL, currentStorageL },
      results: balance,
      provenance: "SIMULATED",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid water balance parameters", details: String(err) },
      { status: 400 }
    );
  }
}
