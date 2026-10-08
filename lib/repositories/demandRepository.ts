import { getAllSites, getSitesByWard, getSiteById } from "./catchmentSiteRepository";
import { matchNonPotableDemand, DEFAULT_INSTITUTIONAL_PROFILE } from "../domain/demandMatcher";
import { DemandProfile, DemandMatchResult, ProvenanceType } from "../domain/types";
import { OperationalMode } from "../db";

export interface SiteDemandRecord {
  siteId: string;
  siteName: string;
  siteType: string;
  wardNumber: number;
  dailyDemandL: number;
  demandMatch: DemandMatchResult;
  provenance: {
    totalVolume: ProvenanceType;
    allocation: "ASSUMED";
  };
}

export interface DemandQueryOptions {
  wardNumber?: number | null;
  siteId?: string | null;
  customProfile?: DemandProfile;
}

export interface DemandQueryResult {
  sites: SiteDemandRecord[];
  totalSitesEvaluated: number;
  basinSummary: {
    totalDailyNonPotableDemandL: number;
    totalSuppliedFromRainwaterL: number;
    totalUnmetDemandL: number;
    overallFulfillmentPct: number;
    applicationApportionment: {
      toiletFlushingL: number;
      landscapeIrrigationL: number;
      hvacCoolingL: number;
      streetCleaningL: number;
    };
  };
  operationalMode: OperationalMode;
  fromDb: boolean;
  provenance: ProvenanceType;
}

export async function queryDemand(options?: DemandQueryOptions): Promise<DemandQueryResult> {
  let sitesData;
  if (options?.siteId) {
    const single = await getSiteById(options.siteId);
    sitesData = {
      sites: single.site ? [single.site] : [],
      operationalMode: single.operationalMode,
      fromDb: single.fromDb,
    };
  } else if (options?.wardNumber) {
    sitesData = await getSitesByWard(options.wardNumber);
  } else {
    sitesData = await getAllSites();
  }

  const { sites, operationalMode, fromDb } = sitesData;

  let totalDemandL = 0;
  let totalSuppliedL = 0;
  let totalFlushingL = 0;
  let totalIrrigationL = 0;
  let totalHvacCoolingL = 0;
  let totalCleaningL = 0;

  const siteDemandRecords: SiteDemandRecord[] = sites.map((site) => {
    const match = matchNonPotableDemand(site, site.currentTankStorageL, options?.customProfile);
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
      dailyDemandL: site.dailyNonPotableDemandL,
      demandMatch: match,
      provenance: {
        totalVolume: (site.provenance?.demand as ProvenanceType) || "SIMULATED",
        allocation: "ASSUMED",
      },
    };
  });

  const overallFulfillmentPct =
    totalDemandL > 0 ? Number(((totalSuppliedL / totalDemandL) * 100).toFixed(1)) : 0;

  return {
    sites: siteDemandRecords,
    totalSitesEvaluated: sites.length,
    basinSummary: {
      totalDailyNonPotableDemandL: totalDemandL,
      totalSuppliedFromRainwaterL: totalSuppliedL,
      totalUnmetDemandL: Math.max(0, totalDemandL - totalSuppliedL),
      overallFulfillmentPct,
      applicationApportionment: {
        toiletFlushingL: totalFlushingL,
        landscapeIrrigationL: totalIrrigationL,
        hvacCoolingL: totalHvacCoolingL,
        streetCleaningL: totalCleaningL,
      },
    },
    operationalMode,
    fromDb,
    provenance: fromDb ? "SIMULATED" : "ASSUMED",
  };
}
