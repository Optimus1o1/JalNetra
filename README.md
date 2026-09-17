# JalNetra Global — AI-Powered Climate & Water Intelligence Digital Twin

> **Version 2.0 — Integrated Global-to-Local Architecture**  
> *Engineered by CIPHER — Decode. Build. Evolve.*

**JalNetra Global** is an intelligence-grade climate, rainfall, and water digital twin platform. It connects macro-scale satellite precipitation signals (NASA GPM IMERG, ENSO, IOD, MJO teleconnections) to hyper-local impacts (urban drainage stress, flood inundation, water levels, and critical infrastructure exposure) through an explainable decision-support dashboard and interactive "What-If" scenario simulator.

---

## 🏛️ Architecture & Core Modules

1. **Executive Cockpit (`/`)**: High-density command HUD with live telemetry ticker, Regional Vulnerability Index gauge, active incident triage feed, and the interactive SVG GIS Digital Twin Canvas.
2. **Global Climate & Teleconnections (`/#global`)**: Live tracking of Pacific ENSO (Niño 3.4), Indian Ocean Dipole (IOD), Madden-Julian Oscillation (MJO), and global NASA GPM IMERG 0.1° satellite anomalies.
3. **Rainfall Intelligence & Nowcasting (`/#rainfall`)**: Multi-horizon probabilistic forecasting (15m, 1h, 3h, 6h, 24h, 72h) with P10/P50/P90 percentile envelopes and local return-period threshold calibration.
4. **Hydrological Water Twin & IoT Network (`/#water-twin`)**: Real-time river gauges (Hooghly tidal stage), drainage canals (Bagjola, Circular, Tolly's Nullah, Monikhali), sump pumps, water quality anomaly detection (turbidity & DO), and an interactive IoT ESP32 observation simulator.
5. **Climate Vulnerability Matrix (`/#vulnerability`)**: Transparent `Risk = Hazard × Exposure × Vulnerability` engine with critical asset exposure overlay (SSKM Hospital, AMRI, Calcutta Medical College, pumping stations).
6. **"What-If" Scenario Simulator (`/#simulation`)**: Interactive scenario engine allowing planners to vary rainfall multipliers (0.8x–2.5x), storm durations, drainage siltation (±50%), tidal surges, and emergency interventions (auxiliary pontoon pumps, automated sluice lockouts).
7. **Alerts & Decision Triage (`/#alerts`)**: Real-time early warning feed with priority severity filtering, civil defense action checklists, and one-click operator acknowledgment.
8. **Model Lab & Scientific Validation (`/#models`)**: ML model registry (LightGBM baseline vs Spatiotemporal PINN champion vs TCN-LSTM), CRPS / Brier score / Spatial IoU benchmarks, and data leakage audit protocols.

---

## 🔌 API Endpoints (Blueprint Section 16)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/global/rainfall` | `GET` | Global NASA GPM satellite precipitation anomalies |
| `/api/v1/weather/forecast` | `GET` | Multi-horizon probabilistic rainfall forecast |
| `/api/v1/climate/indices` | `GET` | ENSO, IOD, and MJO teleconnection driver states |
| `/api/v1/twin/cells/[id]` | `GET` | Single ward cell state & TreeSHAP local attribution |
| `/api/v1/risk/map` | `GET` | GeoJSON FeatureCollection of all digital twin cells |
| `/api/v1/water/forecast` | `GET` | IoT river stage gauges & canal discharge forecasts |
| `/api/v1/simulation` | `POST` / `GET` | Execute "What-If" scenario simulation & retrieve results |
| `/api/v1/alerts` | `GET` / `POST` | Active emergency alerts feed & operator acknowledgment |
| `/api/v1/sensors/observations` | `POST` | Ingest streaming IoT sensor telemetry (ESP32/MQTT) |
| `/api/v1/models/status` | `GET` | ML model evaluation metrics & pipeline freshness |

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run the development server
npm run dev -- --port 3001

# Production build
npm run build
npm run start
```

Access the platform at `http://localhost:3001`.
