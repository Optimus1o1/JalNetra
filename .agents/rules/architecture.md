---
trigger: always_on
description: "Enforce architectural boundaries between the lightweight runtime API, domain services, and offline heavy scientific computation."
---

# JALNETRA Architecture Rule

1. **Lightweight Runtime API**:
   - The production API must remain fast, non-blocking, and thin.
   - Route handlers only parse, validate (Zod/Pydantic), delegate to domain services, and return responses.
   - Do NOT embed mathematical PDE solvers, GIS polygon merges, or model training inside API route handlers.

2. **Domain Isolation**:
   - Pure domain logic lives under `lib/domain/`.
   - Domain modules must have zero coupling to HTTP request/response objects or specific UI frameworks.
   - All domain calculations must be deterministic and testable in pure unit tests.

3. **Heavy Compute Separation**:
   - Heavy scientific simulation (2D hydrodynamic PDE, shallow-water equations, PINN backprop) is performed **offline**.
   - Offline jobs produce calibrated datasets or lightweight surrogate model weights (e.g. XGBoost/linear weights in JSON).
   - The interactive runtime consumes only these precomputed artifacts or surrogate models.
