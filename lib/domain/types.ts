export type ProvenanceType = "MEASURED" | "SIMULATED" | "PREDICTED" | "ASSUMED";

export interface DataProvenance {
  classification: ProvenanceType;
  source: string;
  timestamp: string;
  confidence?: number;
}

export type SiteType = "COMMERCIAL_DEPOT" | "HOSPITAL_CAMPUS" | "UNIVERSITY_CAMPUS" | "MUNICIPAL_PARK" | "RESIDENTIAL_CLUSTER";
export type RechargeSuitabilityClass = "EXCELLENT" | "GOOD" | "MODERATE" | "POOR" | "UNSUITABLE";
export type InterventionType = "ROOFTOP_CISTERN" | "BIO_RETENTION_BIOSWALE" | "PERMEABLE_PAVEMENT_RETROFIT" | "INFILTRATION_RECHARGE_SHAFT" | "COMMUNITY_STORAGE_SUMP";
export type InterventionStatus = "PROPOSED" | "APPROVED" | "IN_PROGRESS" | "OPERATIONAL" | "ASSESSED";

export interface DemandProfile {
  name: string;
  toiletFlushingPct: number;
  landscapeIrrigationPct: number;
  coolingHvacPct: number;
  streetCleaningPct: number;
  provenance: "ASSUMED";
}

export interface CatchmentSite {
  id: string;
  wardNumber: number;
  wardName: string;
  borough: string;
  siteName: string;
  siteType: SiteType;
  coordinates: [number, number]; // [lat, lng]
  roofAreaSqM: number;
  openGroundAreaSqM: number;
  totalCatchmentAreaSqM: number;
  runoffCoefficient: number; // 0.0 - 1.0
  collectionEfficiency: number; // 0.0 - 1.0 (filter/first-flush factor)
  existingTankCapacityL: number;
  currentTankStorageL: number;
  dailyNonPotableDemandL: number;
  soilInfiltrationRateMmHr: number;
  depthToWaterTableM: number;
  rechargeSuitability: RechargeSuitabilityClass;
  provenance: {
    area: ProvenanceType;
    runoffCoeff: ProvenanceType;
    demand: ProvenanceType;
  };
}

export interface RainwaterOpportunity {
  siteId: string;
  siteName: string;
  wardNumber: number;
  rainfallMm: number;
  grossPrecipitationL: number;
  harvestableVolumeL: number;
  unmitigatedRunoffL: number;
  collectionEfficiencyPct: number;
  firstFlushDivertedL: number;
  provenance: "SIMULATED";
}

export interface StorageMassBalance {
  previousStorageL: number;
  inflowL: number;
  reuseWithdrawalL: number;
  rechargeInfiltrationL: number;
  currentStorageL: number;
  tankCapacityL: number;
  overflowL: number;
  storageUtilizationPct: number;
  remainingHeadroomL: number;
  provenance: "SIMULATED";
}

export interface DemandMatchResult {
  totalDailyDemandL: number;
  waterSuppliedFromHarvestL: number;
  unmetDemandL: number;
  demandFulfillmentPct: number;
  demandProfile: DemandProfile;
  applications: {
    toiletFlushingL: number;
    landscapeIrrigationL: number;
    coolingHvacL: number;
    streetCleaningL: number;
  };
  provenance: "ASSUMED";
}

export interface RechargeAssessment {
  siteId: string;
  suitabilityClass: RechargeSuitabilityClass;
  soilInfiltrationRateMmHr: number;
  depthToWaterTableM: number;
  maxDailyRechargeCapacityL: number;
  recommendedInfiltrationStructure: string;
  vadoseZoneClearanceM: number;
  provenance: "SIMULATED";
}

export interface WaterCircularityScore {
  score: number; // 0 - 100
  rating: "LINEAR_DRAINAGE" | "TRANSITIONAL" | "CIRCULAR_ADEQUATE" | "CIRCULAR_EXEMPLARY";
  components: {
    harvestEfficiencyScore: number; // 0 - 100
    demandOffsetScore: number; // 0 - 100
    rechargeContributionScore: number; // 0 - 100
    runoffMitigationScore: number; // 0 - 100
  };
  provenance: "SIMULATED";
}

export interface InterventionOption {
  id: string;
  siteId: string;
  name: string;
  type: InterventionType;
  designCapacityL: number;
  estimatedCostINR: number;
  annualHarvestPotentialML: number;
  annualRunoffAvoidedML: number;
  priorityScore: number; // 0 - 100
  implementationTimelineWeeks: number;
  status: InterventionStatus;
  owner: string;
}

export interface InterventionScenarioComparison {
  scenarioName: string;
  wardNumber: number;
  baseline: {
    totalRunoffL: number;
    totalHarvestedL: number;
    rechargedL: number;
    demandMetPct: number;
    inundationDepthCm: number;
  };
  simulated: {
    totalRunoffL: number;
    totalHarvestedL: number;
    rechargedL: number;
    demandMetPct: number;
    inundationDepthCm: number;
  };
  deltas: {
    runoffReductionL: number;
    runoffReductionPct: number;
    harvestGainL: number;
    rechargeGainL: number;
    inundationReductionCm: number;
  };
  provenance: "SIMULATED";
}
