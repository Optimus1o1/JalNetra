import { CatchmentSite, DemandMatchResult } from "./types";

/**
 * Non-potable reuse demand allocation model.
 * Matches harvested rainwater strictly to approved urban non-potable uses:
 * - Toilet flushing (45%)
 * - Landscape irrigation & horticulture (25%)
 * - HVAC / evaporative cooling towers (15%)
 * - Street cleaning & washdown (15%)
 */
export function matchNonPotableDemand(
  site: CatchmentSite,
  availableStoredWaterL: number
): DemandMatchResult {
  const totalDemand = Math.max(0, site.dailyNonPotableDemandL);
  const availableWater = Math.max(0, availableStoredWaterL);

  // Actual water supplied from harvest is min(available, totalDemand)
  const supplied = Math.min(availableWater, totalDemand);
  const unmet = Math.max(0, totalDemand - supplied);
  const fulfillmentPct = totalDemand > 0 ? Number(((supplied / totalDemand) * 100).toFixed(1)) : 100;

  // Breakdown based on typical municipal building demand apportionment
  const toiletFlushing = Math.round(supplied * 0.45);
  const landscapeIrrigation = Math.round(supplied * 0.25);
  const coolingHvac = Math.round(supplied * 0.15);
  const streetCleaning = Math.max(0, supplied - (toiletFlushing + landscapeIrrigation + coolingHvac));

  return {
    totalDailyDemandL: totalDemand,
    waterSuppliedFromHarvestL: supplied,
    unmetDemandL: unmet,
    demandFulfillmentPct: fulfillmentPct,
    applications: {
      toiletFlushingL: toiletFlushing,
      landscapeIrrigationL: landscapeIrrigation,
      coolingHvacL: coolingHvac,
      streetCleaningL: streetCleaning,
    },
    provenance: "SIMULATED",
  };
}
