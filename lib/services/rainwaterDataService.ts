import { OperationalMode } from "../db";
import { CatchmentSite, InterventionOption } from "../domain/types";
import {
  getAllSites,
  getSitesByWard,
  getSitesByViewport,
  CatchmentSitesRepoResult,
} from "../repositories/catchmentSiteRepository";
import {
  getAllInterventions,
  InterventionsRepoResult,
  FALLBACK_INTERVENTIONS,
} from "../repositories/interventionRepository";
import {
  findByHash,
  saveScenario,
  SaveScenarioInput,
} from "../repositories/scenarioRepository";

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

export async function fetchCatchmentSites(
  wardNumber?: number | null,
  viewport?: { minLat: number; minLng: number; maxLat: number; maxLng: number } | null
): Promise<CatchmentSitesResult> {
  let result: CatchmentSitesRepoResult;

  if (viewport) {
    result = await getSitesByViewport(viewport.minLat, viewport.minLng, viewport.maxLat, viewport.maxLng);
  } else if (wardNumber !== undefined && wardNumber !== null) {
    result = await getSitesByWard(wardNumber);
  } else {
    result = await getAllSites();
  }

  return {
    sites: result.sites,
    operationalMode: result.operationalMode,
    fromDb: result.fromDb,
  };
}

export async function fetchInterventions(statusFilter?: string | null): Promise<InterventionsResult> {
  const result: InterventionsRepoResult = await getAllInterventions(statusFilter);
  return {
    interventions: result.interventions,
    operationalMode: result.operationalMode,
    fromDb: result.fromDb,
  };
}

export async function getPersistedScenarioRecord(scenarioHash: string): Promise<any | null> {
  const record = await findByHash(scenarioHash);
  return record ? record.results : null;
}

export async function persistScenarioRecord(data: SaveScenarioInput): Promise<boolean> {
  return saveScenario(data);
}

export { FALLBACK_INTERVENTIONS };
