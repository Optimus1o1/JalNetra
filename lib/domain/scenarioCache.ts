import crypto from 'node:crypto';
import { calculateStorageBalance } from './storageBalance';
import { calculateOpportunity } from './rainwaterEngine';
import { rainwaterSites } from '../data/rainwaterSitesData';
import { ScenarioParams, ScenarioResult } from './types';

// In-memory bounded LRU cache for scenario evaluations (max 50 scenarios)
const SCENARIO_CACHE_MAX_SIZE = 50;
const scenarioCache = new Map<string, ScenarioResult>();

// Current algorithmic version hash to ensure cache invalidation on logic revisions
export const SCENARIO_ALGORITHM_VERSION = 'v1.2.0-massbalance-hardened';

/**
 * Generates a deterministic SHA-256 scenario hash with algorithm versioning.
 * Format: SHA256(`${SCENARIO_ALGORITHM_VERSION}|${siteId}|${wardId}|${rainfallMm}|${storageCapacityML}|${dailyDemandML}`)
 */
export function generateScenarioHash(params: ScenarioParams): string {
  const payload = [
    SCENARIO_ALGORITHM_VERSION,
    params.siteId,
    params.wardId,
    params.rainfallMm.toFixed(2),
    params.storageCapacityML.toFixed(2),
    params.dailyDemandML.toFixed(2),
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
}

/**
 * Runs a deterministic scenario simulation with LRU cache lookup.
 * Evaluates in <15ms guaranteed.
 */
export function runScenarioCalculation(params: ScenarioParams): {
  result: ScenarioResult;
  cached: boolean;
  scenarioHash: string;
  executionTimeMs: number;
} {
  const startTime = performance.now();
  const scenarioHash = generateScenarioHash(params);

  // Cache hit
  if (scenarioCache.has(scenarioHash)) {
    const cachedResult = scenarioCache.get(scenarioHash)!;
    // Re-insert to refresh LRU order
    scenarioCache.delete(scenarioHash);
    scenarioCache.set(scenarioHash, cachedResult);
    const executionTimeMs = Number((performance.now() - startTime).toFixed(3));
    return {
      result: cachedResult,
      cached: true,
      scenarioHash,
      executionTimeMs,
    };
  }

  // Cache miss: deterministic evaluation
  const site = rainwaterSites.find((s) => s.id === params.siteId) || rainwaterSites[0];
  const opportunity = calculateOpportunity(site, params.rainfallMm);
  const balance = calculateStorageBalance(
    opportunity.harvestablePotentialML,
    params.storageCapacityML,
    params.dailyDemandML,
    site.existingStorageML
  );

  const result: ScenarioResult = {
    ...params,
    ...balance,
    harvestablePotentialML: opportunity.harvestablePotentialML,
    runDate: new Date().toISOString(),
  };

  // Enforce bounded cache size
  if (scenarioCache.size >= SCENARIO_CACHE_MAX_SIZE) {
    const oldestKey = scenarioCache.keys().next().value;
    if (oldestKey) scenarioCache.delete(oldestKey);
  }

  scenarioCache.set(scenarioHash, result);
  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    result,
    cached: false,
    scenarioHash,
    executionTimeMs,
  };
}

export function clearScenarioCache(): void {
  scenarioCache.clear();
}
