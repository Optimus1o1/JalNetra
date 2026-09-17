import { NextResponse } from "next/server";
import { MULTI_HORIZON_FORECASTS } from "@/lib/data/climateIndicesData";

export async function GET() {
  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    region: "Kolkata Metropolitan District (22.57N, 88.36E)",
    forecastMethod: "Probabilistic Multi-Horizon Ensemble (NWP + Satellite Nowcast)",
    forecasts: MULTI_HORIZON_FORECASTS,
    guidance: "Forecasts are probabilistic (P10: 10th percentile low, P50: median, P90: 90th percentile severe scenario).",
  });
}
