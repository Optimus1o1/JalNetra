import { ModelMetadata } from "../types";

export const MODEL_REGISTRY: ModelMetadata[] = [
  {
    id: "mod-prod-pinn-03",
    name: "JalNetra Spatiotemporal PINN (Physics-Informed Neural Network)",
    version: "v2.4.1",
    type: "physics_informed_pinn",
    status: "active_production",
    description: "Multi-scale neural surrogate model enforcing 2D shallow water hydrodynamic equations combined with satellite precipitation embeddings and DEM flow-direction matrices.",
    metrics: {
      crpsScore: 0.182, // Continuous Ranked Probability Score (lower is better)
      brierScore: 0.084, // Calibration score (lower is better, <0.10 is excellent)
      spatialIoU: 0.862, // Intersection over Union against Sentinel-1 SAR flood reference
      f1Score: 0.894,
      falseAlertRate: 0.076, // 7.6% FAR
      latencyMs: 142, // Sub-second inference for 24 wards
    },
    trainingWindow: "2018-2025 Chronologically Blocked (Held-out 2024 Cyclone Remal)",
    dataSources: [
      "NASA GPM IMERG 0.1 deg NRT",
      "Copernicus Sentinel-1 SAR Water Extents",
      "SRTM & ALOS 30m Digital Elevation Models",
      "KMC Automated Telemetry Sump Gauges",
      "NOAA Niño 3.4 & IOD Indices",
    ],
    lastCalibrated: "2026-09-14 (Weekly Walk-Forward Re-calibration)",
  },
  {
    id: "mod-chal-lstm-02",
    name: "Temporal Hydrological TCN-LSTM Ensemble",
    version: "v2.1.0",
    type: "spatiotemporal_lstm",
    status: "challenger_evaluation",
    description: "Deep bidirectional temporal convolutional network with LSTM recurrent heads designed for 72-hour lead time flood probability forecasting.",
    metrics: {
      crpsScore: 0.224,
      brierScore: 0.118,
      spatialIoU: 0.791,
      f1Score: 0.835,
      falseAlertRate: 0.114,
      latencyMs: 380,
    },
    trainingWindow: "2019-2025 Walk-Forward Validation",
    dataSources: [
      "NASA GPM IMERG",
      "NCMRWF / IMD Numerical Weather Forecasts",
      "KMC Historical Rainfall Logs",
    ],
    lastCalibrated: "2026-09-08",
  },
  {
    id: "mod-base-lgbm-01",
    name: "Baseline Calibrated LightGBM Classifier",
    version: "v1.3.2",
    type: "baseline_gradient_boost",
    status: "archive",
    description: "Tabular gradient boosting model trained on 1h/3h/24h antecedent rainfall, topographical wetness index (TWI), and distance to drainage canals.",
    metrics: {
      crpsScore: 0.312,
      brierScore: 0.165,
      spatialIoU: 0.684,
      f1Score: 0.742,
      falseAlertRate: 0.188,
      latencyMs: 35,
    },
    trainingWindow: "2015-2022 Historical Baseline",
    dataSources: [
      "IMD Alipore Station Gauge",
      "OpenStreetMap Road/Building Footprints",
    ],
    lastCalibrated: "2024-11-20",
  },
];

export const DATA_FRESHNESS_MONITORS = [
  {
    source: "NASA GPM IMERG Late Precipitation",
    cadence: "30 Minutes",
    latencyMinutes: 18,
    status: "optimal" as const,
    recordsCount: 1440,
    license: "NASA Open Data / CC-0",
  },
  {
    source: "Copernicus Sentinel-1 SAR GRD",
    cadence: "6-12 Days Orbit",
    latencyMinutes: 120,
    status: "optimal" as const,
    recordsCount: 48,
    license: "Copernicus Open Access",
  },
  {
    source: "KMC Municipal IoT ESP32 Telemetry",
    cadence: "60 Seconds Streaming",
    latencyMinutes: 1,
    status: "optimal" as const,
    recordsCount: 86400,
    license: "Municipal Operational Feeds",
  },
  {
    source: "NOAA CPC Climate Driver Indices",
    cadence: "Daily / Weekly",
    latencyMinutes: 240,
    status: "optimal" as const,
    recordsCount: 365,
    license: "NOAA Public Domain",
  },
];
