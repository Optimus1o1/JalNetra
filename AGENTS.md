<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# JALNETRA ENGINEERING CONTRACT

## PRODUCT OBJECTIVE
JALNETRA is an **Urban Rainwater Intelligence & Circular Water Digital Twin**.
The platform identifies, simulates, and prioritizes opportunities to capture, store, recharge, and reuse rainwater before it becomes uncontrolled urban runoff and drainage pressure.

---

## CORE USER JOURNEY
RAIN → OBSERVE → PREDICT → CAPTURE OPPORTUNITY → STORAGE → REUSE / RECHARGE → RUNOFF REDUCTION → IMPACT

---

## ARCHITECTURE
- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS, MapLibre GL JS, Three.js (selectively), Recharts, TanStack Query, Zod.
- **Backend / API**: Next.js Route Handlers / Lightweight Service Layer (Node.js runtime), strict Zod schemas. No synchronous Python API in production request path.
- **Data**: PostgreSQL, PostGIS, in-memory resilient operational fallback.
- **Scientific**: Deterministic mass-balance hydrological solvers, offline PINN/PDE teachers, lightweight online surrogates.
- **Spatial Scope**: 24 focal pilot catchments/wards with high-resolution telemetry, geometry, and intervention targets; 144-ward macro basin model via precomputed benchmarks.

---

## PERFORMANCE INVARIANTS
### NEVER:
1. Run full hydrodynamic PDE solvers synchronously inside an HTTP request.
2. Train ML models in the production API.
3. Run large GIS/GeoPandas pipelines on normal API requests.
4. Load huge rasters into memory per request.
5. Recalculate all 144 wards dynamically when precomputation/caching is possible.
6. Return giant GeoJSON payloads to the client.
7. Load ML model weights from disk on every request.
8. Run large-scale optimization synchronously.
9. Introduce infrastructure (Kafka, Kubernetes, Redis, Celery) without measuring a real bottleneck.

### PREFER:
1. Precomputation & deterministic scenario hashing.
2. Cached results & in-memory ring buffers.
3. PostGIS & viewport-based spatial queries.
4. Vector tiles & PMTiles.
5. Lightweight surrogate inference.
6. Asynchronous execution for heavy offline jobs.
7. Selective Three.js loading with explicit WebGL disposal.

---

## SCIENTIFIC INTEGRITY
Always explicitly distinguish numerical results as one of:
- `MEASURED`
- `SIMULATED`
- `PREDICTED`
- `ASSUMED`

Never invent or fabricate:
- Sensor measurements
- Model accuracy
- Deployment results
- Water savings or economic numbers
- Flood mitigation claims

---

## UX & PRODUCT PRINCIPLE
Every scientific output must answer: *"What decision does this enable?"*
The primary UI communicates:
- Rainfall & harvestable volume
- Capture potential & recommended storage
- Non-potable reuse demand match
- Groundwater recharge suitability
- Runoff avoidance & drainage relief
- Intervention priority

Advanced scientific diagnostics (ENSO/IOD/MJO, PINN manifolds, 3D radar clouds) belong in the **Science Lab**.
