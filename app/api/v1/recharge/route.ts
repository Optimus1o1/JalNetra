import { NextRequest, NextResponse } from "next/server";
import { getSitesByWard, getRechargeEligibleSites } from "@/lib/repositories/catchmentSiteRepository";
import { assessRechargeSuitability } from "@/lib/domain/rechargeSuitability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardParam = searchParams.get("ward");

  const wardNum = wardParam ? parseInt(wardParam, 10) : null;
  const { sites, operationalMode, fromDb } = wardNum !== null && !isNaN(wardNum)
    ? await getSitesByWard(wardNum)
    : await getRechargeEligibleSites();

  const assessments = sites.map((site) => ({
    site,
    assessment: assessRechargeSuitability(site),
  }));

  const highSuitabilityCount = assessments.filter(
    (a) => a.assessment.suitabilityClass === "HIGH" || a.assessment.suitabilityClass === "EXCELLENT"
  ).length;
  const mediumSuitabilityCount = assessments.filter(
    (a) => a.assessment.suitabilityClass === "MEDIUM" || a.assessment.suitabilityClass === "GOOD" || a.assessment.suitabilityClass === "MODERATE"
  ).length;
  const lowOrUnsuitableCount = assessments.filter(
    (a) =>
      a.assessment.suitabilityClass === "LOW" ||
      a.assessment.suitabilityClass === "POOR" ||
      a.assessment.suitabilityClass === "UNSUITABLE"
  ).length;

  const totalMaxDailyRechargeL = assessments.reduce(
    (sum, a) => sum + a.assessment.maxDailyRechargeCapacityL,
    0
  );

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    operationalMode,
    dataSource: fromDb ? "POSTGRESQL_POSTGIS" : "IN_MEMORY_CALIBRATED_FALLBACK",
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
