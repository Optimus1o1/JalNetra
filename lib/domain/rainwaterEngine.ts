import { CatchmentSite, RainwaterOpportunity } from "./types";

/**
 * Calculates deterministic harvestable rainwater volume for a given site and rainfall event.
 * Formula: Volume (Litres) = Rainfall (mm) * Catchment Area (m^2) * Runoff Coefficient * Collection Efficiency
 * Note: 1 mm of rain over 1 m^2 equals 1 Litre of water (0.001 m^3).
 */
export function calculateHarvestableVolume(
  site: CatchmentSite,
  rainfallMm: number
): RainwaterOpportunity {
  const safeRainfall = Math.max(0, rainfallMm);
  const safeRoofArea = Math.max(0, site.roofAreaSqM);
  const safeRunoffCoeff = Math.min(1.0, Math.max(0.1, site.runoffCoefficient));
  const safeEfficiency = Math.min(1.0, Math.max(0.5, site.collectionEfficiency));

  // Rooftop harvest
  const roofHarvestL = safeRainfall * safeRoofArea * safeRunoffCoeff * safeEfficiency;

  // Additional open ground harvest (bioswales / unsealed grounds if applicable)
  const groundRunoffCoeff = 0.25; // standard unpaved urban soil
  const groundHarvestL =
    safeRainfall * site.openGroundAreaSqM * groundRunoffCoeff * 0.7; // lower efficiency for ground capture

  const totalHarvestL = Math.round(roofHarvestL + groundHarvestL);
  const totalHarvestML = Number((totalHarvestL / 1_000_000).toFixed(4));

  // Recommended tank storage based on 3-day dry spell buffer or single severe downpour (50mm)
  const recommendedStorageL = Math.round(
    Math.max(site.dailyNonPotableDemandL * 3, 50 * safeRoofArea * safeRunoffCoeff * safeEfficiency)
  );

  // Runoff relief: % of precipitation intercepted before drainage canals
  const totalPrecipitationL = safeRainfall * site.totalCatchmentAreaSqM;
  const reliefPct =
    totalPrecipitationL > 0
      ? Number(((totalHarvestL / totalPrecipitationL) * 100).toFixed(1))
      : 0;

  return {
    siteId: site.id,
    siteName: site.siteName,
    wardNumber: site.wardNumber,
    rainfallMm: safeRainfall,
    harvestableVolumeL: totalHarvestL,
    harvestableVolumeML: totalHarvestML,
    recommendedStorageL,
    potentialRunoffAvoidedL: totalHarvestL,
    drainageContributionReliefPct: Math.min(100, reliefPct),
    provenance: "SIMULATED",
  };
}

/**
 * Calculates cumulative harvestable rainwater volume for an entire ward across all its registered sites.
 */
export function calculateWardHarvestableOpportunity(
  wardSites: CatchmentSite[],
  rainfallMm: number
): {
  wardNumber: number;
  totalSites: number;
  totalHarvestableL: number;
  totalHarvestableML: number;
  totalPotentialRunoffAvoidedL: number;
  totalDailyDemandL: number;
  demandFulfillmentPotentialPct: number;
} {
  const results = wardSites.map((site) => calculateHarvestableVolume(site, rainfallMm));
  const totalHarvestableL = results.reduce((acc, curr) => acc + curr.harvestableVolumeL, 0);
  const totalDailyDemandL = wardSites.reduce((acc, curr) => acc + curr.dailyNonPotableDemandL, 0);

  const fulfillmentPct =
    totalDailyDemandL > 0
      ? Number(((totalHarvestableL / totalDailyDemandL) * 100).toFixed(1))
      : 0;

  return {
    wardNumber: wardSites[0]?.wardNumber ?? 0,
    totalSites: wardSites.length,
    totalHarvestableL,
    totalHarvestableML: Number((totalHarvestableL / 1_000_000).toFixed(4)),
    totalPotentialRunoffAvoidedL: totalHarvestableL,
    totalDailyDemandL,
    demandFulfillmentPotentialPct: fulfillmentPct,
  };
}
