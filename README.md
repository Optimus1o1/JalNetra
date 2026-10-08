# JALNETRA (जलनेत्र) — Urban Rainwater Intelligence & Circular Water Digital Twin

**Decisive rainwater capture, distributed storage sizing, groundwater recharge suitability, and municipal runoff abatement for the Kolkata Metropolitan Basin.**

[![Production Deployment](https://img.shields.io/badge/Render-Live%20Production-10b981?style=flat-square&logo=render)](https://jalnetra-b0ab.onrender.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL 17 + PostGIS](https://img.shields.io/badge/PostgreSQL%2017-PostGIS%203.3.7-336791?style=flat-square&logo=postgresql)](https://postgis.net/)
[![Scientific Provenance](https://img.shields.io/badge/Data%20Provenance-STRICT%20CLASSIFIED-06b6d4?style=flat-square)](#scientific-integrity--data-provenance)

---

## Executive Overview
**JALNETRA** turns unpredictable monsoon rainfall from an urban flood liability into a circular, distributed water asset. Rather than allowing torrential downpours to overwhelm Kolkata's British-era drainage systems, JALNETRA provides municipal water engineers and civil administrators with:
1. **Harvestable Volume Forecasting**: Catchment-level calculations grounded in Rational Method runoff coefficients ($Q = C \times I \times A$).
2. **Dynamic Storage Sizing**: Mass-balance simulation calculating uncaptured overflow versus tank retention across dry-weather drawdown periods.
3. **Non-Potable Circular Matching**: Allocation of harvested water directly to high-volume secondary demands (toilet flushing, HVAC cooling towers, municipal horticultural watering).
4. **Recharge Suitability Indexing**: Multi-criteria weighted geological evaluation of underlying aquifer zones (aquifer permeability, depth to water table, soil transmissivity).
5. **Decisive Runoff Abatement**: Quantified reduction in peak stormwater discharge relieving outfall lockups at Palmer's Bridge, Ballygunge, and Dhapa pumping stations.

---

## Live Production Link
The hardened, production-certified system is live at:
🔗 **[https://jalnetra-b0ab.onrender.com](https://jalnetra-b0ab.onrender.com)**

---

## Architecture: Thin Runtime & Resilient Scientific Core

```
                         [ USER / DECISION MAKER ]
                                     |
                                     v
                       [ Next.js App Router (UI) ]
            (Oceanic Cybernetic Dashboard · MapLibre GL · ScoreHero)
                                     |
                                     v
           =====================================================
           LIGHTWEIGHT RUNTIME API LAYER (Node.js Route Handlers)
           =====================================================
             /api/v1/opportunities   /api/v1/water-balance
             /api/v1/interventions   /api/v1/scenarios
             /api/v1/recharge        /api/v1/sensors/observations
                                     |
                 +-------------------+-------------------+
                 |                                       |
                 v                                       v
     [ PostgreSQL 17 + PostGIS ]               [ Deterministic Domain Solvers ]
     - GiST Spatial Indices                    - Rational Method Hydrology
     - Viewport Bounding Boxes                 - Mass-Balance Storage Equation
     - Spatial Intersects & Joins              - Multi-Criteria Recharge Matrix
     - Persisted Scenario Hash Cache           - Circularity Scoring Engine
                 |                                       |
                 +-------------------+-------------------+
                                     |
                        [ Operational Mode Resolver ]
                  - Primary: DATABASE_MODE (PostGIS)
                  - Resilient Fallback: IN_MEMORY_FALLBACK
```

---

## Scientific Integrity & Data Provenance
In adherence to the **JALNETRA Engineering Contract**, every numerical output across the user interface and REST APIs is strictly tagged with its origin class:

| Classification | Meaning & Rigor |
| :--- | :--- |
| **`MEASURED`** | Acquired in real-time from physical telemetry (e.g. 12 IMD/KMC rain gauges, ultrasonic canal stage monitors). |
| **`SIMULATED`** | Derived from deterministic hydrological mass-balance equations or physical laws ($\Delta S = \text{Inflow} - \text{Demand} - \text{Overflow}$). |
| **`PREDICTED`** | Inferred via calibrated surrogate models, ECMWF/IMD numerical weather predictions, or ensemble radar extrapolation. |
| **`ASSUMED`** | Standardized municipal baseline constants (e.g. KMC urban runoff coefficient $C=0.85$, per-capita non-potable demand). |

---

## Production Verification & Test Suite
The codebase is validated by 93 comprehensive automated test suites:
- **`tests/database_phase13_tests.mjs`**: Real PostGIS extensions, spatial bounding box benchmarks (<1 ms), `ST_Contains` spatial joins (0.45 ms), route fallback resilience, and persistence.
- **`tests/hardening_phase12_tests.mjs`**: HMAC-SHA256 telemetry ingest security, storm mode action framing, dynamic demand assumptions, scenario versioning, provenance tags.
- **`tests/rainwater_scientific_tests.mjs`**: Rational Method conservation of mass, non-negative storage invariants, water circularity mathematical bounds.
- **`tests/backend_service_tests.mjs`**: Simulation determinism, telemetry ingest integrity, scenario hash collisions.
- **`tests/e2e_twin_tests.mjs`**: Full system end-to-end user journeys from rain observation to municipal impact prioritization.

---

## Authors & Governance
- **Agency**: **CIPHER** — *Decode. Build. Evolve.*
- **Lead Architect**: **Aniket Nandi**
- **Location**: Kolkata, India (IST)
