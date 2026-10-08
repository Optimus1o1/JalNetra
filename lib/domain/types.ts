export interface CatchmentSite {
  id: string;
  name: string;
  ward: number;
  areaHectares: number;
  runoffCoefficient: number; // C in Rational Method Q = C * I * A
  existingStorageML: number;
  plannedStorageML: number;
  landUse: 'RESIDENTIAL' | 'COMMERCIAL' | 'OPEN_SPACE' | 'INDUSTRIAL';
  geometry?: any;
}

export interface OpportunityCalculation {
  siteId: string;
  siteName: string;
  ward: number;
  rainfallMm: number;
  totalPrecipitationML: number;
  harvestablePotentialML: number; // Volume that can actually be captured given C
  recommendedStorageML: number;
  avoidedRunoffPct: number;
  captureEfficiencyPct: number;
}

export interface StorageBalanceResult {
  retainedML: number;
  overflowML: number;
  deficitML: number;
  finalStorageML: number;
  circularSatisfactionRate: number; // % of demand met by stored rainwater
  daysOfResilience: number; // Days storage can meet non-potable demand without rain
  massBalanceErrorML: number; // Inflow - Outflow - DeltaStorage (must be approx 0)
}

export type DemandCategoryType =
  | 'TOILET_FLUSHING'
  | 'COOLING_TOWERS'
  | 'URBAN_HORTICULTURE'
  | 'FIRE_AND_ROAD_WASHING';

export interface DemandCategory {
  category: DemandCategoryType;
  dailyDemandML: number;
  priority: number; // 1 = highest
  qualityRequired: 'SECONDARY_FILTERED' | 'TERTIARY_TREATED' | 'RAW_RAINWATER';
  description: string;
  provenance: 'ASSUMED';
}

export interface DemandMatchResult {
  totalSupplyML: number;
  totalDemandML: number;
  totalAllocatedML: number;
  unmetDemandML: number;
  surplusWaterML: number;
  overallSatisfactionRate: number;
  breakdown: Array<{
    category: DemandCategoryType;
    demandML: number;
    allocatedML: number;
    satisfactionRate: number;
    priority: number;
  }>;
}

export interface AquiferProperties {
  permeabilityK: number; // m/day
  depthToWaterTableM: number; // m
  soilInfiltrationRateMmHr: number; // mm/hr
  salinityPPM: number;
}

export interface RechargeSuitabilityResult {
  suitabilityScore: number; // 0 to 100
  rating: 'HIGHLY_SUITABLE' | 'MODERATE' | 'MARGINAL' | 'UNSUITABLE';
  limitingFactor: string;
  recommendedMethod: 'INJECTION_WELL' | 'PERCOLATION_PIT' | 'BIOSWALE' | 'NONE';
  maxRechargeRateMLD: number;
  subsurfaceRiskScore: number; // 0 to 100
}

export interface CircularityScoreBreakdown {
  score: number; // 0 to 100
  harvestRatio: number; // % of runoff captured
  demandOffsetRatio: number; // % of non-potable demand offset
  rechargeContributionRatio: number; // % directed to groundwater
  retentionBufferHours: number; // Delay to peak urban runoff
  status: 'EXCELLENT' | 'CIRCULAR' | 'TRANSITIONAL' | 'LINEAR_DRAINAGE';
}

export interface InterventionSite {
  id: string;
  siteId: string;
  ward: number;
  interventionType:
    | 'MODULAR_CISTERN'
    | 'PERMEABLE_PAVEMENT'
    | 'BIOSWALE_CORRIDOR'
    | 'AQUIFER_INJECTION_WELL'
    | 'RETENTION_POND';
  estimatedCostLakhs: number;
  capturePotentialML: number;
  drainageReliefPct: number;
  costEffectivenessRatio: number; // ML per Lakhs INR
  implementationMonths: number;
  spatialSuitability: number; // 0-1
}

export interface InterventionPlan {
  totalBudgetCr: number;
  allocatedBudgetCr: number;
  selectedInterventions: InterventionSite[];
  totalCaptureCapacityML: number;
  averageDrainageReliefPct: number;
  wardsCovered: number[];
}

export interface ScenarioParams {
  rainfallMm: number;
  storageCapacityML: number;
  dailyDemandML: number;
  siteId: string;
  wardId: number;
}

export interface ScenarioResult extends ScenarioParams, StorageBalanceResult {
  harvestablePotentialML: number;
  runDate: string;
}
