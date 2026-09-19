export type RiskSeverity = "critical" | "high" | "medium" | "low";

export interface ShapFactor {
  name: string;
  contribution: number; // percentage or impact value
  direction: "increase" | "decrease";
  description: string;
}

export interface GridCell {
  id: string;
  wardNumber: number;
  wardName: string;
  borough: string;
  coordinates: [number, number]; // [lat, lng]
  elevation: number; // meters above sea level
  slopeDeg: number;
  imperviousness: number; // percentage 0 - 100
  drainageCapacity: number; // mm/hour
  antecedentRainfall72h: number; // mm
  forecastRainfall24h: number; // mm
  soilSaturationPct: number; // 0 - 100
  hazardScore: number; // 0.0 - 1.0
  exposureScore: number; // 0.0 - 1.0
  vulnerabilityScore: number; // 0.0 - 1.0
  riskScore: number; // 0.0 - 1.0 (Hazard * Exposure * Vulnerability)
  floodProbability: number; // 0.0 - 1.0
  waterloggingDepthCm: number;
  populationDensity: number; // persons / sq km
  criticalAssets: {
    hospitals: string[];
    schools: string[];
    pumpingStations: string[];
    transitCorridors: string[];
  };
  shapFactors: ShapFactor[];
  alertStatus: RiskSeverity;
}

export type SensorType =
  | "river_gauge"
  | "canal_flow"
  | "sluice_gate"
  | "stormwater_sump"
  | "groundwater_piezometer";

export interface SensorNode {
  id: string;
  stationCode: string;
  name: string;
  type: SensorType;
  coordinates: [number, number];
  status: "online" | "warning" | "offline";
  waterLevelM: number;
  dangerLevelM: number;
  warningLevelM: number;
  flowVelocityMs: number;
  dischargeCusecs: number;
  turbidityNtu: number;
  dissolvedOxygenMgL: number;
  batteryPct: number;
  lastPing: string;
  anomalyDetected: boolean;
  anomalyMessage?: string;
}

export interface ClimateIndices {
  lastUpdated: string;
  enso: {
    nino34AnomalyC: number;
    phase: "El Niño" | "La Niña" | "Neutral";
    confidencePct: number;
    forecastTrend: string;
    teleconnectionNote: string;
  };
  iod: {
    dmiAnomalyC: number;
    phase: "Positive (+IOD)" | "Negative (-IOD)" | "Neutral";
    teleconnectionNote: string;
  };
  mjo: {
    phase: number;
    amplitude: number;
    convectiveCenter: string;
    monsoonSurgeProbability: number;
  };
  sstAnomalyBayOfBengalC: number;
}

export interface MultiHorizonForecast {
  horizon: string;
  hoursAhead: number;
  validTime: string;
  p10: number; // 10th percentile (low estimate) mm
  p50: number; // Median forecast mm
  p90: number; // 90th percentile (worst-case estimate) mm
  intensityCategory: "Light" | "Moderate" | "Heavy" | "Very Heavy" | "Extremely Severe";
  probabilityOfPrecip: number; // 0 - 100%
}

export interface GlobalPrecipitationAnomaly {
  id: string;
  region: string;
  lat: number;
  lng: number;
  precipitationRateMmH: number;
  anomalyZScore: number;
  percentileRank: number;
  sourceProduct: "NASA GPM IMERG Early" | "GPM Final" | "Copernicus ERA5";
}

export interface SimulationScenarioRequest {
  rainfallMultiplier: number; // 0.5x - 2.5x
  durationHours: number; // 1 - 72h
  drainageEfficiencyPct: number; // -50% to +50%
  tidalSurgeMeters: number; // 0.0m to 2.5m
  emergencyPumpsActive: boolean;
  sluiceGatesAutomated: boolean;
  permeablePavementScenario: boolean;
  temporaryBundsDeployed: boolean;
}

export interface SimulationScenarioResult {
  id: string;
  scenarioName?: string;
  timestamp: string;
  scenarioInputs: SimulationScenarioRequest;
  updatedCells?: GridCell[];
  summary: {
    baselineAvgRisk: number;
    scenarioAvgRisk: number;
    riskDeltaPct: number;
    criticalWardsCount: number;
    inundatedAreaSqKm: number;
    sparedPopulationEst: number;
    mitigatedEconomicRiskCr: number;
  };
  wardDeltas: {
    cellId: string;
    wardNumber: number;
    wardName: string;
    baselineRisk: number;
    scenarioRisk: number;
    delta: number;
    inundationDepthCm: number;
    status: "mitigated" | "escalated" | "unchanged";
  }[];
}

export interface AlertItem {
  id: string;
  alertCode: string;
  title: string;
  wardNumber: number;
  wardName: string;
  cellId: string;
  severity: RiskSeverity;
  category:
    | "Flash Flood Imminent"
    | "Drainage Capacity Exceeded"
    | "Tidal Surge Backflow"
    | "IoT Sensor Anomaly"
    | "Extremely Severe Precipitation";
  hazardScore: number;
  exposureScore: number;
  vulnerabilityScore: number;
  compositeRisk: number;
  confidenceScore: number;
  primaryCause: string;
  affectedInfrastructure: string[];
  recommendedCivilActions: string[];
  issuedAt: string;
  status: "active" | "acknowledged" | "cleared" | "resolved";
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export type AlertIncident = AlertItem;

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  type: "baseline_gradient_boost" | "spatiotemporal_lstm" | "physics_informed_pinn";
  status: "active_production" | "challenger_evaluation" | "archive";
  description: string;
  metrics: {
    crpsScore: number; // Continuous Ranked Probability Score
    brierScore: number; // Flood probability calibration
    spatialIoU: number; // Intersection over Union for flood boundary
    f1Score: number;
    falseAlertRate: number; // FAR (want < 0.12)
    latencyMs: number;
  };
  trainingWindow: string;
  dataSources: string[];
  lastCalibrated: string;
}
