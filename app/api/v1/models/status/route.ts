import { NextResponse } from "next/server";
import { MODEL_REGISTRY, DATA_FRESHNESS_MONITORS } from "@/lib/data/modelsData";

export async function GET() {
  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    championModel: "JalNetra Spatiotemporal PINN v2.4.1",
    models: MODEL_REGISTRY,
    dataPipelines: DATA_FRESHNESS_MONITORS,
    leakageGovernance: {
      temporalCutoffGuaranteed: true,
      protocol: "Strict Walk-Forward Blocked Validation — Zero Future Data Leakage",
    },
  });
}
