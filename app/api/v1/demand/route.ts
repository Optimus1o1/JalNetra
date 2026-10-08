import { NextRequest, NextResponse } from "next/server";
import { queryDemand } from "@/lib/repositories/demandRepository";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardParam = searchParams.get("ward");
  const siteIdParam = searchParams.get("siteId");

  const wardNumber = wardParam ? parseInt(wardParam, 10) : null;
  const result = await queryDemand({
    wardNumber: wardNumber !== null && !isNaN(wardNumber) ? wardNumber : null,
    siteId: siteIdParam || null,
  });

  if (result.sites.length === 0) {
    return NextResponse.json(
      { error: "No sites matched the specified filter criteria" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    operationalMode: result.operationalMode,
    dataSource: result.fromDb ? "POSTGRESQL_POSTGIS" : "IN_MEMORY_CALIBRATED_FALLBACK",
    filter: { ward: wardParam, siteId: siteIdParam },
    totalSitesEvaluated: result.totalSitesEvaluated,
    basinSummary: result.basinSummary,
    sites: result.sites,
    provenance: result.provenance,
  });
}
