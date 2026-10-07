import { NextRequest, NextResponse } from "next/server";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { assessRechargeSuitability } from "@/lib/domain/rechargeSuitability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardParam = searchParams.get("ward");

  let sites = KMC_CATCHMENT_SITES;
  if (wardParam) {
    const wardNum = parseInt(wardParam, 10);
    sites = sites.filter((s) => s.wardNumber === wardNum);
  }

  const assessments = sites.map((site) => ({
    site,
    assessment: assessRechargeSuitability(site),
  }));

  const highSuitabilityCount = assessments.filter(
    (a) => a.assessment.suitabilityClass === "HIGH"
  ).length;
  const mediumSuitabilityCount = assessments.filter(
    (a) => a.assessment.suitabilityClass === "MEDIUM"
  ).length;
  const lowOrUnsuitableCount = assessments.filter(
    (a) => a.assessment.suitabilityClass === "LOW" || a.assessment.suitabilityClass === "UNSUITABLE"
  ).length;

  const totalMaxDailyRechargeL = assessments.reduce(
    (sum, a) => sum + a.assessment.maxDailyRechargeCapacityL,
    0
  );

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    totalSitesAssessed: sites.length,
    basinRechargeOverview: {
      highSuitabilitySites: highSuitabilityCount,
      mediumSuitabilitySites: mediumSuitabilityCount,
      restrictedOrUnsuitableSites: lowOrUnsuitableCount,
      totalMaxDailyRechargeCapacityL: totalMaxDailyRechargeL,
      totalMaxDailyRechargeCapacityML: Number((totalMaxDailyRechargeL / 1_000_000).toFixed(4)),
    },
    sites: assessments.map(({ site, assessment }) => ({
      siteId: site.id,
      siteName: site.siteName,
      wardNumber: site.wardNumber,
      soilInfiltrationRateMmHr: site.soilInfiltrationRateMmHr,
      depthToWaterTableM: site.depthToWaterTableM,
      rechargeAssessment: assessment,
    })),
    provenance: "SIMULATED",
  });
}
