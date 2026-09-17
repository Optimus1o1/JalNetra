import { NextResponse } from "next/server";
import { GLOBAL_PRECIPITATION_ANOMALIES } from "@/lib/data/climateIndicesData";

export async function GET() {
  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    satelliteProduct: "NASA GPM IMERG Early & Late Precipitation Run",
    spatialResolutionDeg: 0.1,
    operationalStatus: "ACTIVE_STREAMING",
    globalAnomalies: GLOBAL_PRECIPITATION_ANOMALIES,
    meta: {
      documentation: "NASA Global Precipitation Measurement (GPM) Mission",
      citation: "Huffman et al., NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)",
    },
  });
}
