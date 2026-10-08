---
name: scientific-validation
description: "Validation procedures for verifying mass-balance closure, physical invariants, and provenance tags."
---

# Scientific Validation Skill

## Invariant Checklist
1. **Non-Negativity**:
   - $\text{Harvestable Volume} \ge 0$
   - $\text{Stored Volume} \ge 0$
   - $\text{Reused Volume} \ge 0$
   - $\text{Recharged Volume} \ge 0$
   - $\text{Uncontrolled Runoff} \ge 0$
2. **Capacity Ceiling**:
   - $\text{Stored Volume} \le \text{Tank Capacity}$
3. **Mass-Balance Closure**:
   - Total Inflow = (Water Stored) + (Water Reused) + (Water Recharged) + (Overflow) + (Losses) within $1\%$ rounding tolerance.
4. **Provenance Assertion**:
   - Verify every UI metric card displays its provenance tag: `MEASURED`, `SIMULATED`, `PREDICTED`, or `ASSUMED`.
