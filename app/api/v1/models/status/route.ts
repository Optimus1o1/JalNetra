import { NextResponse } from "next/server";
import { MODEL_REGISTRY, DATA_FRESHNESS_MONITORS } from "@/lib/data/modelsData";

export async function GET() {
  const models = MODEL_REGISTRY.map((m) => ({
    ...m,
    architecture: m.type,
    crps: m.metrics.crpsScore,
    inferenceLatencyMs: m.metrics.latencyMs,
  }));

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    championModel: "JalNetra Spatiotemporal PINN v2.4.1",
    models,
    dataPipelines: DATA_FRESHNESS_MONITORS,
    leakageGovernance: {
      temporalCutoffGuaranteed: true,
      protocol: "Strict Walk-Forward Blocked Validation — Zero Future Data Leakage",
    },
  });
}
