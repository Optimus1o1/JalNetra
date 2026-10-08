import { NextRequest, NextResponse } from "next/server";
import { findByHash, saveScenario } from "@/lib/repositories/scenarioRepository";
import { getSitesByWard, getAllSites } from "@/lib/repositories/catchmentSiteRepository";
import { simulateInterventionScenario } from "@/lib/domain/interventionPlanner";
import {
  generateScenarioHash,
  getCachedScenario,
  storeCachedScenario,
  getScenarioCacheStats,
} from "@/lib/domain/scenarioCache";
import { clampNumber } from "@/lib/security/sanitize";
import { getOperationalMode } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const wardNumber = clampNumber(body.wardNumber, 1, 144, 66);
    const rainfallEventMm = clampNumber(body.rainfallEventMm, 5, 300, 65);
    const addedStorageCapacityL = clampNumber(body.addedStorageCapacityL, 0, 10_000_000, 80_000);
    const permeablePavementFractionPct = clampNumber(
      body.permeablePavementFractionPct,
      0,
      100,
      25
    );
    const activeRechargeWells = Boolean(body.activeRechargeWells ?? true);
    const captureEfficiencyBoostPct = clampNumber(
      body.captureEfficiencyBoostPct,
      0,
      50,
      15
    );
    const scenarioName = body.scenarioName || `Ward ${wardNumber} Stormwater Capture & Infiltration Plan`;

    // 1. Generate deterministic scenario hash
    const scenarioHash = generateScenarioHash({
      wardNumber,
      rainfallEventMm,
      addedStorageCapacityL,
      permeablePavementFractionPct,
      activeRechargeWells,
      captureEfficiencyBoostPct,
    });

    const currentOperationalMode = await getOperationalMode();

    // 2. Check in-memory LRU Cache (L1)
    const inMemoryCached = getCachedScenario(scenarioHash);
    if (inMemoryCached) {
      return NextResponse.json({
        status: "success",
        cacheHit: true,
        operationalMode: currentOperationalMode,
        source: "IN_MEMORY_CACHE",
        scenarioHash,
        scenario: inMemoryCached,
        cacheStats: getScenarioCacheStats(),
      });
    }

    // 3. Check Database Persistence (L2)
    const dbPersisted = await findByHash(scenarioHash);
    if (dbPersisted) {
      // Warm in-memory cache
      storeCachedScenario(scenarioHash, dbPersisted.results as any);
      return NextResponse.json({
        status: "success",
        cacheHit: true,
        operationalMode: currentOperationalMode,
        source: "POSTGRESQL_PERSISTED",
        scenarioHash,
        scenario: dbPersisted.results,
        cacheStats: getScenarioCacheStats(),
      });
    }

    // 4. Resolve Catchment Sites from Repository (PostgreSQL / Fallback)
    const { sites: fetchedSites, operationalMode, fromDb } = await getSitesByWard(wardNumber);
    let wardSites = fetchedSites;
    if (wardSites.length === 0) {
      const { sites: allSites } = await getAllSites();
      wardSites = allSites;
    }

    // 5. Execute Lightweight Deterministic Intervention Simulation
    const result = simulateInterventionScenario({
      scenarioName,
      wardNumber,
      rainfallEventMm,
      sites: wardSites,
      captureEfficiencyBoostPct,
      addedStorageCapacityL,
      activeRechargeWells,
      permeablePavementFractionPct,
    });

    // 6. Warm in-memory L1 cache
    storeCachedScenario(scenarioHash, result);

    // 7. Persist to PostgreSQL (L2) with conflict safety
    try {
      await saveScenario({
        scenarioHash,
        scenarioName,
        wardNumber,
        rainfallEventMm,
        calculationVersion: "2.4.0",
        modelVersion: "JalNetra-MassBalance-v1",
        inputs: {
          wardNumber,
          rainfallEventMm,
          addedStorageCapacityL,
          permeablePavementFractionPct,
          activeRechargeWells,
          captureEfficiencyBoostPct,
        },
        results: result,
        provenance: "SIMULATED",
      });
    } catch (err) {
      console.warn("[JalNetra Scenario] Persistence notice:", err);
    }

    return NextResponse.json({
      status: "success",
      cacheHit: false,
      operationalMode,
      dataSource: fromDb ? "POSTGRESQL_POSTGIS" : "IN_MEMORY_CALIBRATED_FALLBACK",
      scenarioHash,
      scenario: result,
      cacheStats: getScenarioCacheStats(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to simulate scenario", details: String(error) },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    description: "Interactive Scenario Simulation API with SHA-256 caching and PostGIS persistence.",
    cacheStats: getScenarioCacheStats(),
  });
}
