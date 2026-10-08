---
trigger: always_on
description: "Protect JALNETRA production runtime from CPU, memory, payload, and rendering overload."
---

# JALNETRA Performance Invariants

1. **CPU Protection**:
   - Heavy scientific computation must NEVER run synchronously inside normal API requests.
   - Interactive sliders and scenarios must evaluate in <100ms using deterministic caching or lightweight surrogate inference.
   - No model training or full-mesh PDE iterations in the production request cycle.

2. **Memory Protection**:
   - Never load large rasters or multi-megabyte GIS files into RAM on a per-request basis.
   - In-memory caches and ring buffers must be explicitly bounded (e.g., max 50 items) and pruned periodically.
   - Model weights must load as singletons at application startup, never read from disk per request.

3. **Rendering & WebGL**:
   - Selective 3D only: Do not render full Three.js WebGL scenes where 2D vector GIS (MapLibre/SVG) is sufficient.
   - When 3D canvases are unmounted, explicitly invoke `renderer.dispose()` and deallocate geometry and texture GPU buffers.
   - Lazy-load heavy visualization components using Next.js `next/dynamic` with `{ ssr: false }`.

4. **Payload Minimization**:
   - Never stream raw city-wide polygon coordinates (>2 MB) in normal API responses.
   - Prefer lightweight tabular/numerical summaries; serve static boundaries via CDN or vector tiles.
