import { getPrismaClient, checkDatabaseHealth, OperationalMode } from "@/lib/db";
import { CatchmentSite, InterventionOption, SiteType, RechargeSuitabilityClass } from "@/lib/domain/types";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { MUNICIPAL_INTERVENTIONS } from "@/app/api/v1/interventions/route";

export interface CatchmentSitesResult {
  sites: CatchmentSite[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export interface InterventionsResult {
  interventions: InterventionOption[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export async function fetchCatchmentSites(wardNumber?: number | null): Promise<CatchmentSitesResult> {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const dbSites = await prisma.catchmentSite.findMany({
        where: wardNumber ? { wardNumber } : undefined,
        orderBy: [{ wardNumber: "asc" }, { siteName: "asc" }],
      });

      if (dbSites && dbSites.length > 0) {
        const sites: CatchmentSite[] = dbSites.map((row) => ({
          id: row.siteKey,
          wardNumber: row.wardNumber,
          wardName: row.wardName,
          borough: row.borough,
          siteName: row.siteName,
          siteType: row.siteType as SiteType,
          coordinates: [row.latitude, row.longitude],
          roofAreaSqM: row.roofAreaSqM,
          openGroundAreaSqM: row.openGroundAreaSqM,
          totalCatchmentAreaSqM: row.totalCatchmentAreaSqM,
          runoffCoefficient: row.runoffCoefficient,
          collectionEfficiency: row.collectionEfficiency,
          existingTankCapacityL: row.existingTankCapacityL,
          currentTankStorageL: row.currentTankStorageL,
          dailyNonPotableDemandL: row.dailyNonPotableDemandL,
          soilInfiltrationRateMmHr: row.soilInfiltrationRateMmHr,
          depthToWaterTableM: row.depthToWaterTableM,
          rechargeSuitability: row.rechargeSuitability as RechargeSuitabilityClass,
          provenance: (row.provenance as any) || {
            area: "MEASURED",
            runoffCoeff: "ASSUMED",
            demand: "SIMULATED",
          },
        }));

        return {
          sites,
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[JalNetra Data] CatchmentSite DB query failed, falling back to calibrated in-memory twin store:", err);
    }
  }

  // Resilient fallback
  const fallback = wardNumber
    ? KMC_CATCHMENT_SITES.filter((s) => s.wardNumber === wardNumber)
    : KMC_CATCHMENT_SITES;

  return {
    sites: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function fetchInterventions(statusFilter?: string | null): Promise<InterventionsResult> {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const dbInterventions = await prisma.interventionOption.findMany({
        where: statusFilter
          ? { status: { equals: statusFilter.toUpperCase() } }
          : undefined,
        orderBy: [{ priorityScore: "desc" }],
      });

      if (dbInterventions && dbInterventions.length > 0) {
        const interventions: InterventionOption[] = dbInterventions.map((row) => ({
          id: row.interventionKey,
          siteId: row.siteId || "",
          name: row.name,
          type: row.type as any,
          designCapacityL: row.designCapacityL,
          estimatedCostINR: row.estimatedCostInr,
          annualHarvestPotentialML: row.annualHarvestPotentialMl,
          annualRunoffAvoidedML: row.annualRunoffAvoidedMl,
          priorityScore: row.priorityScore,
          implementationTimelineWeeks: row.implementationTimelineWeeks,
          status: row.status as any,
          owner: row.owner,
        }));

        return {
          interventions,
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[JalNetra Data] InterventionOption DB query failed, falling back to in-memory store:", err);
    }
  }

  // Resilient fallback
  let fallback = MUNICIPAL_INTERVENTIONS;
  if (statusFilter) {
    fallback = fallback.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return {
    interventions: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getPersistedScenarioRecord(scenarioHash: string): Promise<any | null> {
  const prisma = getPrismaClient();
  if (!prisma) return null;

  try {
    const record = await prisma.persistedScenario.findUnique({
      where: { scenarioHash },
    });
    return record?.results || null;
  } catch (err) {
    console.warn("[JalNetra Data] PersistedScenario query failed:", err);
  }
  return null;
}

export async function persistScenarioRecord(data: {
  scenarioHash: string;
  scenarioName: string;
  wardNumber: number;
  rainfallEventMm: number;
  calculationVersion: string;
  modelVersion: string;
  inputs: any;
  results: any;
  provenance?: string;
}): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) return false;

  try {
    await prisma.persistedScenario.upsert({
      where: { scenarioHash: data.scenarioHash },
      update: {
        scenarioName: data.scenarioName,
        rainfallEventMm: data.rainfallEventMm,
        results: data.results,
        inputs: data.inputs,
      },
      create: {
        scenarioHash: data.scenarioHash,
        scenarioName: data.scenarioName,
        wardNumber: data.wardNumber,
        rainfallEventMm: data.rainfallEventMm,
        calculationVersion: data.calculationVersion,
        modelVersion: data.modelVersion,
        inputs: data.inputs,
        results: data.results,
        provenance: data.provenance || "SIMULATED",
      },
    });
    return true;
  } catch (err) {
    console.warn("[JalNetra Data] PersistedScenario upsert failed:", err);
    return false;
  }
}
