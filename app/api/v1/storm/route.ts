import { NextRequest, NextResponse } from "next/server";
import { getAllSites, getSitesByWard } from "@/lib/repositories/catchmentSiteRepository";
import { MULTI_HORIZON_FORECASTS } from "@/lib/data/climateIndicesData";
import { calculateHarvestableVolume } from "@/lib/domain/rainwaterEngine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardParam = searchParams.get("ward");

  // Use the 3-hour storm window forecast (64mm median)
  const stormForecast = MULTI_HORIZON_FORECASTS[2] || {
    horizon: "3-Hour Storm Window",
    p50: 64.0,
    intensityCategory: "Very Heavy",
    probabilityOfPrecip: 88,
  };

  const stormRainfallMm = stormForecast.p50;

  const wardNum = wardParam ? parseInt(wardParam, 10) : null;
  const { sites, operationalMode, fromDb } = wardNum !== null && !isNaN(wardNum)
    ? await getSitesByWard(wardNum)
    : await getAllSites();

  // Compute basin-wide tank capacity and current storage
  let totalBasinCapacityL = 0;
  let totalCurrentStorageL = 0;
  let totalPotentialHarvestL = 0;

  const siteActions = sites.map((site) => {
    totalBasinCapacityL += site.existingTankCapacityL;
    totalCurrentStorageL += site.currentTankStorageL;

    const opp = calculateHarvestableVolume(site, stormRainfallMm);
    totalPotentialHarvestL += opp.harvestableVolumeL;

    const availableHeadroomL = Math.max(0, site.existingTankCapacityL - site.currentTankStorageL);
    const deficitL = Math.max(0, opp.harvestableVolumeL - availableHeadroomL);

    // Recommended pre-storm drawdown
    const recommendedDrawdownL = Math.min(site.currentTankStorageL, deficitL);

    return {
      siteId: site.id,
      siteName: site.siteName,
      wardNumber: site.wardNumber,
      existingTankCapacityL: site.existingTankCapacityL,
      currentStorageL: site.currentTankStorageL,
      availableHeadroomL,
      expectedHarvestL: opp.harvestableVolumeL,
      overflowRiskWithoutDrawdownL: deficitL,
      recommendedPreStormDrawdownL: recommendedDrawdownL,
      actionStatus:
        recommendedDrawdownL > 0
          ? "CRITICAL_DRAWDOWN_RECOMMENDED"
          : "STORAGE_HEADROOM_OPTIMAL",
    };
  });

  const basinAvailableHeadroomL = Math.max(0, totalBasinCapacityL - totalCurrentStorageL);
  const totalRecommendedDrawdownL = siteActions.reduce(
    (sum, a) => sum + a.recommendedPreStormDrawdownL,
    0
  );

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    operationalMode,
    dataSource: fromDb ? "POSTGRESQL_POSTGIS" : "IN_MEMORY_CALIBRATED_FALLBACK",
    stormAlert: {
      leadTimeHours: 3.0,
      forecastProduct: stormForecast.horizon,
      expectedRainfallMm: stormRainfallMm,
      intensity: stormForecast.intensityCategory,
      probabilityOfPrecipitationPct: stormForecast.probabilityOfPrecip,
    },
    basinStorageReadiness: {
      totalTankCapacityML: Number((totalBasinCapacityL / 1_000_000).toFixed(3)),
      currentStoredWaterML: Number((totalCurrentStorageL / 1_000_000).toFixed(3)),
      availableHeadroomML: Number((basinAvailableHeadroomL / 1_000_000).toFixed(3)),
      potentialStormHarvestML: Number((totalPotentialHarvestL / 1_000_000).toFixed(3)),
      recommendedPreStormDrawdownML: Number((totalRecommendedDrawdownL / 1_000_000).toFixed(3)),
    },
    operationalProtocol: [
      "1. Activate pre-emptive non-potable tank discharge into approved urban recharge shafts to free storage headroom.",
      "2. Verify rooftop first-flush bypass filters are cleared of leaves and silt.",
      "3. Lock low-elevation tidal sluices at Hooghly outfalls if river stage exceeds +5.20m MSL.",
      "4. Divert overflow channels to municipal retention basins before street ponding thresholds (15 cm).",
    ],
    sites: siteActions,
    provenance: "SIMULATED",
  });
}
