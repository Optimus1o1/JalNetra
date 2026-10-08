import { prisma } from '../db';
import { rainwaterSites } from '../data/rainwaterSitesData';
import { municipalInterventions } from '../domain/interventionPlanner';
import { CatchmentSite, InterventionSite } from '../domain/types';

/**
 * Resiliently fetches catchment sites from PostgreSQL/PostGIS.
 * Falls back transparently to in-memory GeoJSON dataset if DB connection is unavailable.
 */
export async function fetchCatchmentSites(): Promise<{
  sites: CatchmentSite[];
  fromDatabase: boolean;
}> {
  try {
    const dbSites = await prisma.catchmentSite.findMany({
      orderBy: { ward: 'asc' },
    });

    if (dbSites && dbSites.length > 0) {
      const sites: CatchmentSite[] = dbSites.map((s) => ({
        id: s.id,
        name: s.name,
        ward: s.ward,
        areaHectares: s.areaHectares,
        runoffCoefficient: s.runoffCoefficient,
        existingStorageML: s.existingStorageML,
        plannedStorageML: s.plannedStorageML,
        landUse: s.landUse as 'RESIDENTIAL' | 'COMMERCIAL' | 'OPEN_SPACE' | 'INDUSTRIAL',
        geometry: s.geometry ?? undefined,
      }));
      return { sites, fromDatabase: true };
    }
  } catch (err) {
    console.warn('PostgreSQL CatchmentSite query failed, falling back to local dataset:', err);
  }

  return { sites: rainwaterSites, fromDatabase: false };
}

/**
 * Resiliently fetches municipal intervention options from PostgreSQL.
 * Falls back transparently to in-memory dataset if DB connection is unavailable.
 */
export async function fetchInterventions(wardId?: number): Promise<{
  interventions: InterventionSite[];
  fromDatabase: boolean;
}> {
  try {
    const whereClause = wardId ? { ward: wardId } : {};
    const dbInterventions = await prisma.interventionOption.findMany({
      where: whereClause,
      orderBy: { costEffectivenessRatio: 'desc' },
    });

    if (dbInterventions && dbInterventions.length > 0) {
      const interventions: InterventionSite[] = dbInterventions.map((item) => ({
        id: item.id,
        siteId: item.siteId,
        ward: item.ward,
        interventionType: item.interventionType as any,
        estimatedCostLakhs: item.estimatedCostLakhs,
        capturePotentialML: item.capturePotentialML,
        drainageReliefPct: item.drainageReliefPct,
        costEffectivenessRatio: item.costEffectivenessRatio,
        implementationMonths: item.implementationMonths,
        spatialSuitability: item.spatialSuitability,
      }));
      return { interventions, fromDatabase: true };
    }
  } catch (err) {
    console.warn('PostgreSQL InterventionOption query failed, falling back to local dataset:', err);
  }

  const filtered = wardId
    ? municipalInterventions.filter((i) => i.ward === wardId)
    : municipalInterventions;
  return { interventions: filtered, fromDatabase: false };
}

/**
 * Persists an evaluated scenario result to PostgreSQL for L2 persistence caching.
 */
export async function persistScenarioRecord(
  scenarioHash: string,
  rainfallMm: number,
  storageCapacityML: number,
  dailyDemandML: number,
  resultPayload: any
): Promise<void> {
  try {
    await prisma.persistedScenario.upsert({
      where: { scenarioHash },
      update: {
        accessCount: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        scenarioHash,
        rainfallMm,
        storageCapacityML,
        dailyDemandML,
        resultPayload,
        accessCount: 1,
      },
    });
  } catch (err) {
    // Non-blocking: database scenario write is supplementary to L1 memory cache
    console.warn('Failed to persist scenario hash to PostgreSQL:', scenarioHash, err);
  }
}

/**
 * Retrieves a persisted scenario result from PostgreSQL by parameter values.
 */
export async function getPersistedScenarioRecord(
  rainfallMm: number,
  storageCapacityML: number,
  dailyDemandML: number
): Promise<{ resultPayload: any; scenarioHash: string } | null> {
  try {
    const record = await prisma.persistedScenario.findFirst({
      where: {
        rainfallMm,
        storageCapacityML,
        dailyDemandML,
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (record) {
      return {
        resultPayload: record.resultPayload,
        scenarioHash: record.scenarioHash,
      };
    }
  } catch (err) {
    console.warn('PostgreSQL PersistedScenario lookup failed:', err);
  }
  return null;
}
