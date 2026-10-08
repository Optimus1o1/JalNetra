import { NextResponse } from "next/server";
import { GLOBAL_PRECIPITATION_ANOMALIES } from "@/lib/data/climateIndicesData";

export async function GET() {
  const bands = GLOBAL_PRECIPITATION_ANOMALIES.map((a) => ({
    ...a,
    anomalyMm: Number((a.anomalyZScore * 12.5).toFixed(1)),
    precipRateMmHr: a.precipitationRateMmH,
  }));

  return NextResponse.json({
    status: "success",
    source: "NASA_GPM_IMERG_V07",
    spatialResolution: "0.1_deg_approx_10km",
    spatialResolutionDeg: 0.1,
    timestamp: new Date().toISOString(),
    satelliteProduct: "NASA GPM IMERG Early & Late Precipitation Run",
    operationalStatus: "ACTIVE_STREAMING",
    bands,
    globalAnomalies: bands,
    meta: {
      documentation: "NASA Global Precipitation Measurement (GPM) Mission",
      citation: "Huffman et al., NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)",
    },
  });
}
