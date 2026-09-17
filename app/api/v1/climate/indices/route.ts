import { NextResponse } from "next/server";
import { CLIMATE_INDICES_SNAPSHOT } from "@/lib/data/climateIndicesData";

export async function GET() {
  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    climateIndices: CLIMATE_INDICES_SNAPSHOT,
    drivers: {
      enso: "El Niño-Southern Oscillation (Niño 3.4 index)",
      iod: "Indian Ocean Dipole (Dipole Mode Index)",
      mjo: "Madden-Julian Oscillation (Real-time Multivariate MJO RMM1/RMM2)",
    },
    scientificNote: "Climate teleconnection indices inform regional probability distributions rather than deterministic local rainfall volumes.",
  });
}
