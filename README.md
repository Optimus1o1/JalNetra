# JalNetra Global — Urban Water & Climate Digital Twin

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Tests](https://img.shields.io/badge/Tests-30%2F30%20Passing-emerald?style=for-the-badge&logo=jest)
![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)

**Physics-Informed Climate, Rainfall & Hydrodynamic Early Warning System for Kolkata Metropolitan Area**

*Engineered by **CIPHER** — Decode. Build. Evolve.*

</div>

---

## 🌊 Executive Overview

**JalNetra Global** is an intelligence-grade climate resilience and hydrodynamic digital twin platform. It bridges planetary-scale atmospheric signals (NASA GPM IMERG satellite precipitation, ENSO Niño 3.4, Indian Ocean Dipole, and Madden-Julian Oscillation) with street-level urban drainage physics across all **144 administrative wards of the Kolkata Municipal Corporation (KMC)**.

Operating at the confluence of heavy monsoon precipitation, Hooghly estuary tidal locks, and silted drainage canals (Bagjola, Circular, Tolly's Nullah, and Monikhali), JalNetra provides municipal emergency planners and hydrologists with explainable, actionable early warnings before catastrophic inundation occurs.

---

## 🏛️ System Architecture & Key Modules

```
Planetary Teleconnections (ENSO/IOD/MJO) & NASA GPM IMERG Satellite
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │        JalNetra Core AI & Hydro Solvers       │
        │  • Spatiotemporal PINN (Physics-Informed NN) │
        │  • 2D Shallow Water Equations (SWE) Solver   │
        │  • TreeSHAP Explainable AI Attribution Engine │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
[Executive Cockpit]   [Spatial Digital Twin]  [What-If Simulator]
• Telemetry Ticker    • 144 Catchment Wards   • 2D Hydrodynamic PDE
• 2D Scrubber         • TreeSHAP XAI HUD      • Avoided Loss Receipts
• 3D Sluice Twin      • Critical Asset Layers • Spared Citizens Count
```

### 1. 🌐 3D Interactive Climate Globe (`/#global`)
- Interactive WebGL globe rendering global NASA GPM 0.1° precipitation anomalies.
- Real-time teleconnection tracking: Pacific ENSO Niño 3.4, Indian Ocean Dipole (IOD), and MJO phase velocity.
- **Dedicated Cloud Locator Mode**: Precision reticle tracking with optical density calculations and cloud dismiss controls.

### 2. 🎛️ Unified Operations Command Cockpit (`/`)
- Single-pane-of-glass executive command HUD with live telemetry tickers, municipal drainage alerts, and regional vulnerability gauges.
- **Dynamic 2D Hydrodynamic Nowcast & Radar QPE Scrubber**: Dual-axis hydrograph with real-time marker interpolation across $-12\text{h}$ to $+12\text{h}$ time slices and embankment crest breach warnings ($+2.80\text{m}$ MSL).

### 3. 🗺️ High-Resolution Spatial Digital Twin
- Vector GIS engine modeling all **144 Kolkata catchment wards**.
- Integrated **TreeSHAP Explainable AI (XAI)** decomposition identifying exact root causes (e.g. 42% rainfall inflow, 28% tidal backflow, 18% silt resistance, -12% pump relief).
- Critical asset exposure mapping: SSKM Hospital, AMRI, Calcutta Medical College, and key municipal pumping stations.

### 4. 🚪 3D Photorealistic Hydraulic Water Twin (`/#water-twin`)
- Authentic civil engineering model of an estuarine tidal sluice gate structure with high-resolution weathered concrete and structural steel textures.
- Dual-tier water bodies (Upstream Hooghly river stage vs. Downstream drainage basin) with dynamic gravity discharge plume simulation.
- **CAD Zoom & Inspection Controls**: Smooth mouse wheel zoom, touchscreen pinch-to-zoom, top bar stepped zoom, and camera orbital presets (`ISO`, `RIVER`, `CANAL`, `GANTRY`).

### 5. ⚡ What-If Hydrodynamic Scenario Simulator (`/#simulation`)
- 2D shallow-water numerical solver calculating runoff depth, flood duration, and risk escalation across all 144 wards.
- Configurable parameters: Rainfall intensity ($0.8\times - 2.5\times$), storm duration, tidal stage, canal desilting, auxiliary pumps, and automated sluice lockouts.
- **Official Simulation Run Receipt**: Emits immutable run telemetry (`sim-run-...`) logging solver convergence, spared population count, and avoided economic damages in ₹ Crores, with a 1-click transition to view scenario deltas on the live map.

### 6. 🧪 Model Lab & Scientific Validation (`/#models`)
- Comprehensive MLOps registry benchmarking production champions against challengers (*Spatiotemporal PINN v2.4.1* vs *Dilated Causal TCN-LSTM* vs *Spatial GCN + LightGBM*).
- Validates rigorous scientific metrics: **CRPS**, **Brier Score** ($<0.10$ optimal), **Spatial IoU**, and **False Alert Rate** ($<10\%$).
- **Google Colab Model Ingestion**: Import custom model artifacts trained via [`colab/train_model.py`](file:///c:/Users/ANIKET/OneDrive/Documents/JalNetra/colab/train_model.py) and hot-swap production weights on the fly.
- Section 19 Data Leakage Guard enforcing walk-forward temporal splits.

### 7. 🚨 Incident Triage, Decision Protocols & IoT Network (`/#alerts`)
- Priority emergency dispatch engine with civil defense action checklists.
- Streaming IoT sensor ingestion API supporting physical ESP32 microcontrollers and ultrasonic level monitors.

---

## 🔌 REST API Specifications

The platform exposes a full suite of versioned REST endpoints adhering to Section 16 of the JalNetra Engineering Blueprint:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/global/rainfall` | `GET` | Satellite precipitation anomalies from NASA GPM IMERG |
| `/api/v1/weather/forecast` | `GET` | Multi-horizon quantile forecasts (15m, 1h, 3h, 6h, 24h, 72h) |
| `/api/v1/climate/indices` | `GET` | Planetary teleconnection driver states (ENSO, IOD, MJO) |
| `/api/v1/twin/cells/[id]` | `GET` | Ward-specific cell state, depth, and TreeSHAP attribution |
| `/api/v1/risk/map` | `GET` | GeoJSON FeatureCollection of all 144 catchment polygons |
| `/api/v1/water/forecast` | `GET` | Real-time river stage telemetry, surge warnings, and lock states |
| `/api/v1/simulation` | `POST` / `GET` | Execute 2D hydrodynamic simulation and persist run receipts |
| `/api/v1/alerts` | `GET` / `POST` | Live emergency incident feed and tactical dispatch logging |
| `/api/v1/sensors/observations` | `POST` | Ingest streaming IoT sensor telemetry (ESP32/MQTT) with QA/QC |
| `/api/v1/models/status` | `GET` | ML model evaluation metrics, CRPS benchmarks, and freshness |
| `/api/v1/models/custom` | `GET` / `POST` | Ingest and evaluate external Google Colab model artifacts |
| `/api/v1/admin/seed` | `GET` / `POST` | Baseline GIS database synchronization & diagnostic health check |

---

## 💻 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, zero `any`)
- **3D Graphics & WebGL**: [Three.js](https://threejs.org/) with custom shaders and CAD orbit controls
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom cybernetic glassmorphism
- **Machine Learning & Python**: [PyTorch](https://pytorch.org/), [XGBoost](https://xgboost.readthedocs.io/), [scikit-learn](https://scikit-learn.org/), [TreeSHAP](https://github.com/slundberg/shap)
- **Database**: PostgreSQL / Supabase with postgis extensions
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Optimus1o1/JalNetra.git
cd JalNetra

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## 🧪 Automated Testing & Quality Assurance

JalNetra includes an automated test suite verifying IoT data validation, TreeSHAP decomposition, tidal interlocks, REST API endpoints, and hydrodynamic physics:

```bash
npm test
```

```
✔ 1. IoT Telemetry Quality Control & Boundary Checks (4/4 passed)
✔ 2. Twin Risk & TreeSHAP Attribution Decomposition (2/2 passed)
✔ 3. Hooghly Estuary Tidal Hydrodynamics & Sluice Gate Interlocks (1/1 passed)
✔ 4. Decision Triage & Incident Dispatch Protocol (2/2 passed)
✔ 5. Hydrodynamic Simulation Logging & Avoided Loss Accounting (1/1 passed)
✔ 6. Administrative Database Synchronization & Seed Endpoint (2/2 passed)
✔ 7. Custom Colab Model Ingestion & Live Inference (3/3 passed)
✔ 8. REST API Endpoints (11/11 passed)
✔ 9. Scientific Simulation Physics Engine (3/3 passed)
✔ 10. Pilot Region GIS Data Invariants (1/1 passed)

ℹ tests 30 | suites 12 | pass 30 | fail 0 | 100% Passing
```

To run strict TypeScript type validation:
```bash
npx tsc --noEmit
```

---

## 🧠 Training Custom Models (Google Colab)

To train new Physics-Informed Neural Networks on your own flood datasets:
1. Open [`colab/train_model.py`](file:///c:/Users/ANIKET/OneDrive/Documents/JalNetra/colab/train_model.py) in Google Colab or your local Python environment.
2. Run the pipeline to download public monsoon precipitation datasets, train the XGBoost/PINN models, and calculate TreeSHAP weights.
3. Download the generated `jalnetra_custom_model.json` artifact.
4. Navigate to **Model Lab (`/#models`)** $\rightarrow$ Click **"Import Model JSON"** $\rightarrow$ Click **"PROMOTE TO CHAMPION"**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author & Agency

**Aniket Nandi**  
Lead Full-Stack Developer & Designer at **CIPHER** — *Decode. Build. Evolve.*  
Kolkata, India  

GitHub: [@Optimus1o1](https://github.com/Optimus1o1)
