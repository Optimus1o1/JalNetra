import { NextRequest, NextResponse } from "next/server";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { simulateInterventionScenario } from "@/lib/domain/interventionPlanner";
import {
  generateScenarioHash,
  getCachedScenario,
  storeCachedScenario,
  getScenarioCacheStats,
} from "@/lib/domain/scenarioCache";
import { clampNumber } from "@/lib/security/sanitize";

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

    // 2. Check Cache
    const cached = getCachedScenario(scenarioHash);
    if (cached) {
      return NextResponse.json({
        status: "success",
        cacheHit: true,
        scenarioHash,
        scenario: cached,
        cacheStats: getScenarioCacheStats(),
      });
    }

    // 3. Resolve Catchment Sites
    let wardSites = KMC_CATCHMENT_SITES.filter((s) => s.wardNumber === wardNumber);
    if (wardSites.length === 0) {
      // Fallback to all sites in pilot basin if ward has no registered sites
      wardSites = KMC_CATCHMENT_SITES;
    }

    // 4. Execute Lightweight Intervention Simulation
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

    // 5. Cache result
    storeCachedScenario(scenarioHash, result);

    return NextResponse.json({
      status: "success",
      cacheHit: false,
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
    description: "Interactive Scenario Simulation API with SHA-256 caching and surrogate acceleration.",
    cacheStats: getScenarioCacheStats(),
  });
}
