---
trigger: always_on
description: "Frontend design standards, design tokens, typography, and accessibility."
---

# JALNETRA Frontend & UX Rules

1. **Brand & Typography**:
   - Palette: Deep oceanic dark-mode background (`#030712`), cyan/emerald accents (`#06b6d4`, `#10b981`), amber warnings (`#f59e0b`), rose critical alerts (`#f43f5e`).
   - Clean cybernetic glassmorphism: consistent border radii (`rounded-xl`), subtle borders (`border-slate-800/80`), translucent glass (`bg-slate-900/60 backdrop-blur-md`).
   - Fonts: Modern sans-serif with monospaced accents (`font-mono`) for numerical telemetry.

2. **Core Narrative & User Flow**:
   - The primary UX must answer:
     1. *What is happening?* (Rainfall & current storage)
     2. *What can the city do?* (Harvestable potential & intervention sites)
     3. *What impact will it make?* (Baseline vs. JalNetra avoided runoff)
   - Do NOT lead with abstract atmospheric teleconnections (ENSO, IOD, MJO) or deep learning training manifolds; keep these in the **Science Lab**.

3. **Performance & Dynamic Loading**:
   - Use `next/dynamic` with `{ ssr: false }` for Three.js WebGL canvases.
   - Maintain visible focus rings and responsive layout for mobile and desktop.
