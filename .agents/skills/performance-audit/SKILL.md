---
name: performance-audit
description: "Workflow for measuring API latency, payload sizes, memory usage, and WebGL rendering load."
---

# Performance Audit Skill

## Workflow
1. **API Benchmark**:
   - Check endpoint response latency target: p50 < 200ms, p95 < 500ms.
   - Verify scenario requests evaluate in < 100ms via cache hit or surrogate.
2. **Payload Verification**:
   - Verify API JSON responses remain below 50 KB per request.
   - Check that raw GeoJSON geometries are omitted from standard telemetry calls.
3. **Client-Side WebGL Health**:
   - Ensure Three.js renderers unmount cleanly and call `renderer.dispose()`.
   - Prevent more than two concurrent WebGL contexts from rendering active animation loops.
