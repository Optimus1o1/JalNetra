// JalNetra — Urban Rainwater Intelligence & Circular Water Digital Twin Domain Types

export type DataProvenance = "MEASURED" | "SIMULATED" | "PREDICTED" | "ASSUMED";

export type SiteType =
  | "ROOFTOP_RESIDENTIAL"
  | "ROOFTOP_COMMERCIAL"
  | "PUBLIC_INSTITUTION" // e.g. Hospitals, Universities, Municipal buildings
  | "COMMUNITY_PLAZA"
  | "PARK_OPEN_SPACE";

export type RechargeSuitabilityClass = "HIGH" | "MEDIUM" | "LOW" | "UNSUITABLE";

export type InterventionType =
  | "ROOFTOP_CISTERN"
  | "COMMUNITY_STORAGE_SUMP"
  | "INFILTRATION_RECHARGE_SHAFT"
  | "BIO_RETENTION_BIOSWALE"
  | "PERMEABLE_PAVEMENT_RETROFIT";

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
  runoffCoefficient: number; // 0.15 - 0.95
  collectionEfficiency: number; // 0.80 - 0.90 (first flush rejection accounted)
  existingTankCapacityL: number;
  currentTankStorageL: number;
  dailyNonPotableDemandL: number;
  soilInfiltrationRateMmHr: number;
  depthToWaterTableM: number;
  rechargeSuitability: RechargeSuitabilityClass;
  provenance: Record<string, DataProvenance>;
}

export interface RainwaterOpportunity {
  siteId: string;
  siteName: string;
  wardNumber: number;
  rainfallMm: number;
  harvestableVolumeL: number;
  harvestableVolumeML: number; // Mega-litres (million litres)
  recommendedStorageL: number;
  potentialRunoffAvoidedL: number;
  drainageContributionReliefPct: number;
  provenance: DataProvenance;
}

export interface StorageBalanceResult {
  previousStorageL: number;
  inflowL: number;
  reuseWithdrawalL: number;
  rechargeInfiltrationL: number;
  lossesL: number;
  currentStorageL: number;
  overflowL: number;
  tankCapacityL: number;
  fillPercentage: number;
  storageHeadroomL: number; // remaining capacity before overflow
  provenance: DataProvenance;
}

export interface DemandMatchResult {
  totalDailyDemandL: number;
  waterSuppliedFromHarvestL: number;
  unmetDemandL: number;
  demandFulfillmentPct: number;
  applications: {
    toiletFlushingL: number;
    landscapeIrrigationL: number;
    coolingHvacL: number;
    streetCleaningL: number;
  };
  provenance: DataProvenance;
}

export interface RechargeAssessment {
  siteId: string;
  suitabilityClass: RechargeSuitabilityClass;
  rechargeScore: number; // 0 - 100
  percolationRateMmHr: number;
  maxDailyRechargeCapacityL: number;
  limitingFactors: string[];
  recommendedMethod: string;
  provenance: DataProvenance;
}

export interface WaterCircularityScore {
  compositeScore: number; // 0 - 100
  rating: "OPTIMAL" | "BALANCED" | "DEVELOPING" | "CRITICAL_DEFICIT";
  dimensions: {
    capturePotential: number; // 0 - 100
    reuseFulfillment: number; // 0 - 100
    rechargeEffectiveness: number; // 0 - 100
    floodRunoffRelief: number; // 0 - 100
  };
  factorWeights: {
    capture: number;
    reuse: number;
    recharge: number;
    runoffRelief: number;
  };
  explanations: {
    name: string;
    impact: number;
    direction: "positive" | "negative";
    narrative: string;
  }[];
  provenance: DataProvenance;
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
  status: "PROPOSED" | "ASSESSED" | "APPROVED" | "IN_PROGRESS" | "OPERATIONAL";
  owner: string;
}

export interface InterventionScenarioComparison {
  scenarioId: string;
  scenarioName: string;
  wardNumber: number;
  rainfallEventMm: number;
  baseline: {
    totalRainfallVolumeML: number;
    uncontrolledRunoffML: number;
    capturedVolumeML: number;
    reusedVolumeML: number;
    rechargedVolumeML: number;
    canalDrainageLoadCumec: number;
    inundationExposureIndex: number;
  };
  intervention: {
    totalRainfallVolumeML: number;
    uncontrolledRunoffML: number;
    capturedVolumeML: number;
    reusedVolumeML: number;
    rechargedVolumeML: number;
    canalDrainageLoadCumec: number;
    inundationExposureIndex: number;
  };
  deltas: {
    runoffAvoidedML: number;
    runoffReductionPct: number;
    capturedIncreaseML: number;
    reusedIncreaseML: number;
    rechargeIncreaseML: number;
    drainageReliefCumec: number;
    avoidedLossCroresINR: number;
  };
  provenance: DataProvenance;
}
