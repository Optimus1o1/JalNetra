export type ProvenanceType = "MEASURED" | "SIMULATED" | "PREDICTED" | "ASSUMED";

export interface DataProvenance {
  classification: ProvenanceType;
  source: string;
  timestamp: string;
  confidence?: number;
}

export type SiteType =
  | "COMMERCIAL_DEPOT"
  | "HOSPITAL_CAMPUS"
  | "UNIVERSITY_CAMPUS"
  | "MUNICIPAL_PARK"
  | "RESIDENTIAL_CLUSTER"
  | "PUBLIC_INSTITUTION"
  | "COMMUNITY_PLAZA";

export type RechargeSuitabilityClass =
  | "EXCELLENT"
  | "GOOD"
  | "MODERATE"
  | "POOR"
  | "UNSUITABLE"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type InterventionType =
  | "ROOFTOP_CISTERN"
  | "BIO_RETENTION_BIOSWALE"
  | "PERMEABLE_PAVEMENT_RETROFIT"
  | "INFILTRATION_RECHARGE_SHAFT"
  | "COMMUNITY_STORAGE_SUMP";

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
    area?: ProvenanceType;
    roofArea?: ProvenanceType;
    runoffCoeff?: ProvenanceType;
    runoffCoefficient?: ProvenanceType;
    demand?: ProvenanceType;
    existingTankCapacity?: ProvenanceType;
    soilInfiltrationRate?: ProvenanceType;
    [key: string]: ProvenanceType | undefined;
  };
}

export interface RainwaterOpportunity {
  siteId: string;
  siteName: string;
  wardNumber: number;
  rainfallMm: number;
  roofAreaSqM?: number;
  runoffCoefficient?: number;
  collectionEfficiency?: number;
  grossPrecipitationL?: number;
  harvestableVolumeL: number;
  harvestableVolumeML?: number;
  recommendedStorageL?: number;
  potentialRunoffAvoidedL?: number;
  drainageContributionReliefPct?: number;
  unmitigatedRunoffL?: number;
  collectionEfficiencyPct?: number;
  firstFlushDivertedL?: number;
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
  lossesL?: number;
  fillPercentage?: number;
  storageHeadroomL?: number;
  storageUtilizationPct?: number;
  remainingHeadroomL?: number;
  provenance: "SIMULATED";
}

export type StorageBalanceResult = StorageMassBalance;

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
  rechargeScore?: number;
  soilInfiltrationRateMmHr?: number;
  percolationRateMmHr?: number;
  depthToWaterTableM?: number;
  maxDailyRechargeCapacityL: number;
  recommendedInfiltrationStructure?: string;
  recommendedMethod?: string;
  limitingFactors?: string[];
  vadoseZoneClearanceM?: number;
  provenance: "SIMULATED";
}

export interface WaterCircularityScore {
  score?: number; // 0 - 100
  compositeScore?: number; // 0 - 100
  rating:
    | "LINEAR_DRAINAGE"
    | "TRANSITIONAL"
    | "CIRCULAR_ADEQUATE"
    | "CIRCULAR_EXEMPLARY"
    | "OPTIMAL"
    | "BALANCED"
    | "DEVELOPING"
    | "CRITICAL_DEFICIT";
  components?: {
    harvestEfficiencyScore: number; // 0 - 100
    demandOffsetScore: number; // 0 - 100
    rechargeContributionScore: number; // 0 - 100
    runoffMitigationScore: number; // 0 - 100
  };
  dimensions?: {
    capturePotential: number;
    reuseFulfillment: number;
    rechargeEffectiveness: number;
    floodRunoffRelief: number;
  };
  factorWeights?: Record<string, number>;
  explanations?: Array<{
    name: string;
    impact: number;
    direction: "positive" | "negative";
    narrative: string;
  }>;
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

export interface InterventionBaselineMetrics {
  totalRainfallVolumeML: number;
  uncontrolledRunoffML: number;
  capturedVolumeML: number;
  reusedVolumeML: number;
  rechargedVolumeML: number;
  canalDrainageLoadCumec: number;
  inundationExposureIndex: number;
  totalRunoffL?: number;
  totalHarvestedL?: number;
  rechargedL?: number;
  demandMetPct?: number;
  inundationDepthCm?: number;
}

export interface InterventionMetrics {
  totalRainfallVolumeML: number;
  uncontrolledRunoffML: number;
  capturedVolumeML: number;
  reusedVolumeML: number;
  rechargedVolumeML: number;
  canalDrainageLoadCumec: number;
  inundationExposureIndex: number;
}

export interface InterventionDeltas {
  runoffAvoidedML: number;
  runoffReductionPct: number;
  capturedIncreaseML: number;
  reusedIncreaseML: number;
  rechargeIncreaseML: number;
  drainageReliefCumec: number;
  avoidedLossCroresINR: number;
  runoffReductionL?: number;
  harvestGainL?: number;
  rechargeGainL?: number;
  inundationReductionCm?: number;
}

export interface InterventionScenarioComparison {
  scenarioId?: string;
  scenarioName: string;
  wardNumber: number;
  rainfallEventMm?: number;
  baseline: InterventionBaselineMetrics;
  intervention: InterventionMetrics;
  simulated?: {
    totalRunoffL?: number;
    totalHarvestedL?: number;
    rechargedL?: number;
    demandMetPct?: number;
    inundationDepthCm?: number;
  };
  deltas: InterventionDeltas;
  provenance: "SIMULATED";
}
