import type { CatchmentSite, DemandMatchResult, DemandProfile } from "./types";

/**
 * Standard benchmark demand profiles based on typical municipal building typologies.
 * All profiles are explicitly classified as ASSUMED engineering defaults.
 */
export const DEFAULT_INSTITUTIONAL_PROFILE: DemandProfile = {
  name: "General Institutional Baseline",
  toiletFlushingPct: 45,
  landscapeIrrigationPct: 25,
  coolingHvacPct: 15,
  streetCleaningPct: 15,
  provenance: "ASSUMED",
};

export const HOSPITAL_CAMPUS_PROFILE: DemandProfile = {
  name: "Healthcare & Hospital Complex (e.g. SSKM)",
  toiletFlushingPct: 50,
  landscapeIrrigationPct: 10,
  coolingHvacPct: 30,
  streetCleaningPct: 10,
  provenance: "ASSUMED",
};

export const TRANSIT_FACILITY_PROFILE: DemandProfile = {
  name: "Transit Hub & Bus Maintenance Shed (e.g. Tiljala Depot)",
  toiletFlushingPct: 20,
  landscapeIrrigationPct: 10,
  coolingHvacPct: 10,
  streetCleaningPct: 60,
  provenance: "ASSUMED",
};

export const EDUCATIONAL_CAMPUS_PROFILE: DemandProfile = {
  name: "University & Educational Institute",
  toiletFlushingPct: 45,
  landscapeIrrigationPct: 35,
  coolingHvacPct: 10,
  streetCleaningPct: 10,
  provenance: "ASSUMED",
};

export const MUNICIPAL_OFFICE_PROFILE: DemandProfile = {
  name: "Municipal Administrative Building",
  toiletFlushingPct: 55,
  landscapeIrrigationPct: 20,
  coolingHvacPct: 15,
  streetCleaningPct: 10,
  provenance: "ASSUMED",
};

/**
 * Validates that demand profile percentages are non-negative and sum to 100% (within 0.5% tolerance).
 */
export function validateDemandProfile(profile: DemandProfile): { valid: boolean; reason?: string } {
  const { toiletFlushingPct, landscapeIrrigationPct, coolingHvacPct, streetCleaningPct } = profile;

  if (
    toiletFlushingPct < 0 ||
    landscapeIrrigationPct < 0 ||
    coolingHvacPct < 0 ||
    streetCleaningPct < 0 ||
    toiletFlushingPct > 100 ||
    landscapeIrrigationPct > 100 ||
    coolingHvacPct > 100 ||
    streetCleaningPct > 100
  ) {
    return { valid: false, reason: "Demand percentages must be non-negative and cannot exceed 100%." };
  }

  const total = toiletFlushingPct + landscapeIrrigationPct + coolingHvacPct + streetCleaningPct;
  if (Math.abs(total - 100) > 0.5) {
    return {
      valid: false,
      reason: `Demand percentages must sum to 100% (current sum: ${total.toFixed(1)}%).`,
    };
  }

  return { valid: true };
}

/**
 * Non-potable reuse demand allocation model.
 * Matches harvested rainwater strictly to approved urban non-potable uses.
 * Configurable via custom DemandProfile with explicit ASSUMED provenance.
 */
export function matchNonPotableDemand(
  site: CatchmentSite,
  availableStoredWaterL: number,
  customProfile?: DemandProfile
): DemandMatchResult {
  const profile = customProfile || DEFAULT_INSTITUTIONAL_PROFILE;
  const validation = validateDemandProfile(profile);

  if (!validation.valid) {
    throw new Error(`Invalid Demand Profile configuration: ${validation.reason}`);
  }

  const totalDemand = Math.max(0, site.dailyNonPotableDemandL);
  const availableWater = Math.max(0, availableStoredWaterL);

  // Actual water supplied from harvest is min(available, totalDemand)
  const supplied = Math.min(availableWater, totalDemand);
  const unmet = Math.max(0, totalDemand - supplied);
  const fulfillmentPct = totalDemand > 0 ? Number(((supplied / totalDemand) * 100).toFixed(1)) : 100;

  // Breakdown dynamically calculated using the validated demand profile
  const toiletFlushing = Math.round((supplied * profile.toiletFlushingPct) / 100);
  const landscapeIrrigation = Math.round((supplied * profile.landscapeIrrigationPct) / 100);
  const coolingHvac = Math.round((supplied * profile.coolingHvacPct) / 100);
  const streetCleaning = Math.max(0, supplied - (toiletFlushing + landscapeIrrigation + coolingHvac));

  return {
    totalDailyDemandL: totalDemand,
    waterSuppliedFromHarvestL: supplied,
    unmetDemandL: unmet,
    demandFulfillmentPct: fulfillmentPct,
    demandProfile: profile,
    applications: {
      toiletFlushingL: toiletFlushing,
      landscapeIrrigationL: landscapeIrrigation,
      coolingHvacL: coolingHvac,
      streetCleaningL: streetCleaning,
    },
    provenance: "ASSUMED",
  };
}
