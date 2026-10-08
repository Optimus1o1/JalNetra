import { NextResponse } from "next/server";
import { CLIMATE_INDICES_SNAPSHOT } from "@/lib/data/climateIndicesData";

export async function GET() {
  const ensoPhase = CLIMATE_INDICES_SNAPSHOT.enso.phase.includes("El Niño")
    ? "EL_NINO"
    : CLIMATE_INDICES_SNAPSHOT.enso.phase.includes("La Niña")
    ? "LA_NINA"
    : "NEUTRAL";

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    ensoPhase,
    iodIndex: CLIMATE_INDICES_SNAPSHOT.iod.dmiAnomalyC,
    mjoPhase: CLIMATE_INDICES_SNAPSHOT.mjo.phase,
    activeTeleconnections: [
      CLIMATE_INDICES_SNAPSHOT.enso.phase,
      CLIMATE_INDICES_SNAPSHOT.iod.phase,
      `MJO Phase ${CLIMATE_INDICES_SNAPSHOT.mjo.phase}`,
    ],
    climateIndices: CLIMATE_INDICES_SNAPSHOT,
    drivers: {
      enso: "El Niño-Southern Oscillation (Niño 3.4 index)",
      iod: "Indian Ocean Dipole (Dipole Mode Index)",
      mjo: "Madden-Julian Oscillation (Real-time Multivariate MJO RMM1/RMM2)",
    },
    scientificNote: "Climate teleconnection indices inform regional probability distributions rather than deterministic local rainfall volumes.",
  });
}
