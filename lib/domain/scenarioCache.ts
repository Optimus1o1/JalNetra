import crypto from "crypto";
import { InterventionScenarioComparison } from "./types";

export const SCENARIO_CALCULATION_VERSION = "2.1.0";
export const SCENARIO_MODEL_VERSION = "1.4.0";

interface CacheEntry {
  hash: string;
  result: InterventionScenarioComparison;
  createdAt: number;
  calculationVersion: string;
  modelVersion: string;
}

const MAX_CACHE_SIZE = 100;
const scenarioCache = new Map<string, CacheEntry>();

/**
 * Generates a deterministic SHA-256 hash string for an intervention scenario configuration.
 * Binds calculationVersion and modelVersion into the cache key to guarantee zero stale result leakage.
 */
export function generateScenarioHash(
  config: {
    wardNumber: number;
    rainfallEventMm: number;
    addedStorageCapacityL: number;
    permeablePavementFractionPct: number;
    activeRechargeWells: boolean;
    captureEfficiencyBoostPct: number;
  },
  calculationVersion: string = SCENARIO_CALCULATION_VERSION,
  modelVersion: string = SCENARIO_MODEL_VERSION
): string {
  const normalizedKey = [
    `v:${calculationVersion}`,
    `m:${modelVersion}`,
    `w:${config.wardNumber}`,
    `r:${config.rainfallEventMm.toFixed(1)}`,
    `s:${Math.round(config.addedStorageCapacityL)}`,
    `p:${Math.round(config.permeablePavementFractionPct)}`,
    `rw:${config.activeRechargeWells ? 1 : 0}`,
    `eff:${Math.round(config.captureEfficiencyBoostPct)}`,
  ].join("|");

  return crypto.createHash("sha256").update(normalizedKey).digest("hex").substring(0, 24);
}

/**
 * Retrieves a cached scenario result if present.
 */
export function getCachedScenario(hash: string): InterventionScenarioComparison | null {
  const entry = scenarioCache.get(hash);
  if (!entry) return null;
  return entry.result;
}

/**
 * Stores a scenario result into the bounded scenario cache.
 */
export function storeCachedScenario(
  hash: string,
  result: InterventionScenarioComparison,
  calculationVersion: string = SCENARIO_CALCULATION_VERSION,
  modelVersion: string = SCENARIO_MODEL_VERSION
): void {
  if (scenarioCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry (FIFO)
    const oldestKey = scenarioCache.keys().next().value;
    if (oldestKey) {
      scenarioCache.delete(oldestKey);
    }
  }
  scenarioCache.set(hash, {
    hash,
    result,
    createdAt: Date.now(),
    calculationVersion,
    modelVersion,
  });
}

/**
 * Returns cache diagnostics including versioning tags.
 */
export function getScenarioCacheStats(): {
  size: number;
  maxSize: number;
  calculationVersion: string;
  modelVersion: string;
} {
  return {
    size: scenarioCache.size,
    maxSize: MAX_CACHE_SIZE,
    calculationVersion: SCENARIO_CALCULATION_VERSION,
    modelVersion: SCENARIO_MODEL_VERSION,
  };
}

/**
 * Clears the cache (for testing and manual invalidation).
 */
export function clearScenarioCache(): void {
  scenarioCache.clear();
}
