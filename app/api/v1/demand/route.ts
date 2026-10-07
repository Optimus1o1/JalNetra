import { NextRequest, NextResponse } from "next/server";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { matchNonPotableDemand } from "@/lib/domain/demandMatcher";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardParam = searchParams.get("ward");
  const siteIdParam = searchParams.get("siteId");

  let sites = KMC_CATCHMENT_SITES;
  if (siteIdParam) {
    sites = sites.filter((s) => s.id === siteIdParam);
  } else if (wardParam) {
    const wardNum = parseInt(wardParam, 10);
    sites = sites.filter((s) => s.wardNumber === wardNum);
  }

  if (sites.length === 0) {
    return NextResponse.json(
      { error: "No sites matched the specified filter criteria" },
      { status: 404 }
    );
  }

  let totalDemandL = 0;
  let totalSuppliedL = 0;
  let totalFlushingL = 0;
  let totalIrrigationL = 0;
  let totalHvacCoolingL = 0;
  let totalCleaningL = 0;

  const siteMatches = sites.map((site) => {
    const match = matchNonPotableDemand(site, site.currentTankStorageL);
    totalDemandL += match.totalDailyDemandL;
    totalSuppliedL += match.waterSuppliedFromHarvestL;
    totalFlushingL += match.applications.toiletFlushingL;
    totalIrrigationL += match.applications.landscapeIrrigationL;
    totalHvacCoolingL += match.applications.coolingHvacL;
    totalCleaningL += match.applications.streetCleaningL;

    return {
      siteId: site.id,
      siteName: site.siteName,
      siteType: site.siteType,
      wardNumber: site.wardNumber,
      demandMatch: match,
    };
  });

  const overallFulfillmentPct =
    totalDemandL > 0 ? Number(((totalSuppliedL / totalDemandL) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    filter: { ward: wardParam, siteId: siteIdParam },
    totalSitesEvaluated: sites.length,
    basinSummary: {
      totalDailyNonPotableDemandL: totalDemandL,
      totalSuppliedFromRainwaterL: totalSuppliedL,
      totalUnmetDemandL: totalDemandL - totalSuppliedL,
      overallFulfillmentPct,
      applicationApportionment: {
        toiletFlushingL: totalFlushingL,
        landscapeIrrigationL: totalIrrigationL,
        hvacCoolingL: totalHvacCoolingL,
        streetCleaningL: totalCleaningL,
      },
    },
    sites: siteMatches,
    provenance: "SIMULATED",
  });
}
