import crypto from "crypto";
import { InterventionScenarioComparison } from "./types";

interface CacheEntry {
  hash: string;
  result: InterventionScenarioComparison;
  createdAt: number;
}

const MAX_CACHE_SIZE = 100;
const scenarioCache = new Map<string, CacheEntry>();

/**
 * Generates a deterministic SHA-256 hash string for an intervention scenario configuration.
 */
export function generateScenarioHash(config: {
  wardNumber: number;
  rainfallEventMm: number;
  addedStorageCapacityL: number;
  permeablePavementFractionPct: number;
  activeRechargeWells: boolean;
  captureEfficiencyBoostPct: number;
}): string {
  const normalizedKey = [
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
export function storeCachedScenario(hash: string, result: InterventionScenarioComparison): void {
  if (scenarioCache.size >= MAX_CACHE_SIZE) {
    // Delete oldest entry
    const oldestKey = scenarioCache.keys().next().value;
    if (oldestKey) {
      scenarioCache.delete(oldestKey);
    }
  }
  scenarioCache.set(hash, {
    hash,
    result,
    createdAt: Date.now(),
  });
}

/**
 * Returns cache diagnostics.
 */
export function getScenarioCacheStats(): { size: number; maxSize: number } {
  return {
    size: scenarioCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
