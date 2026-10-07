import { CatchmentSite, RechargeAssessment, RechargeSuitabilityClass } from "./types";

/**
 * Multi-criteria hydrogeological assessment for artificial groundwater recharge.
 * Factors evaluated:
 * 1. Soil infiltration rate (mm/hr): Sandy/alluvial > Silty clay > Dense deltaic clay
 * 2. Depth to water table (meters): High water table (<2.0m) limits recharge capacity and risks waterlogging
 * 3. Open ground footprint (m^2)
 */
export function assessRechargeSuitability(site: CatchmentSite): RechargeAssessment {
  const limitingFactors: string[] = [];
  let score = 50;

  // 1. Soil Infiltration Analysis
  if (site.soilInfiltrationRateMmHr >= 25) {
    score += 25;
  } else if (site.soilInfiltrationRateMmHr >= 10) {
    score += 10;
  } else if (site.soilInfiltrationRateMmHr < 5) {
    score -= 20;
    limitingFactors.push("Low hydraulic conductivity (impermeable Gangetic clay stratum <5 mm/h)");
  }

  // 2. Depth to Water Table Analysis
  if (site.depthToWaterTableM >= 6.0) {
    score += 20; // Ample vadose zone storage
  } else if (site.depthToWaterTableM >= 3.5) {
    score += 10;
  } else if (site.depthToWaterTableM < 2.0) {
    score -= 30;
    limitingFactors.push("High shallow water table (<2.0m MSL) risks localized waterlogging");
  }

  // 3. Open Space Footprint
  if (site.openGroundAreaSqM < 50) {
    score -= 15;
    limitingFactors.push("Constrained open surface area for percolation basins");
  }

  // Bounded score 0 - 100
  const normalizedScore = Math.max(0, Math.min(100, score));

  let suitabilityClass: RechargeSuitabilityClass = "MEDIUM";
  let recommendedMethod = "Borewell-assisted recharge shaft with dual gravel/sand silt trap";

  if (normalizedScore >= 75) {
    suitabilityClass = "HIGH";
    recommendedMethod = "Gravity recharge pit / percolation trench with permeable bioswale";
  } else if (normalizedScore < 40) {
    suitabilityClass = "LOW";
    recommendedMethod = "Restricted recharge: prioritize detention storage over shallow infiltration";
  }

  if (site.depthToWaterTableM < 1.0) {
    suitabilityClass = "UNSUITABLE";
    recommendedMethod = "Unsuitable for recharge: water table at surface. Strictly divert to tank storage.";
  }

  // Daily max recharge rate (L/day) = Infiltration Rate (m/day) * Area (m^2) * 1000 * Safety Factor (0.6)
  const infiltrationRateMDay = (site.soilInfiltrationRateMmHr * 24) / 1000;
  const maxDailyRechargeL = Math.round(
    suitabilityClass === "UNSUITABLE"
      ? 0
      : Math.min(site.openGroundAreaSqM * infiltrationRateMDay * 1000 * 0.6, 250_000)
  );

  return {
    siteId: site.id,
    suitabilityClass,
    rechargeScore: normalizedScore,
    percolationRateMmHr: site.soilInfiltrationRateMmHr,
    maxDailyRechargeCapacityL: maxDailyRechargeL,
    limitingFactors,
    recommendedMethod,
    provenance: "SIMULATED",
  };
}
