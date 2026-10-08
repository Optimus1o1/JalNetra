import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_INSTITUTIONAL_PROFILE,
  HOSPITAL_CAMPUS_PROFILE,
  matchNonPotableDemand,
  validateDemandProfile,
} from "../lib/domain/demandMatcher.ts";
import { generateScenarioHash } from "../lib/domain/scenarioCache.ts";

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";
const TELEMETRY_KEY = process.env.TELEMETRY_INGESTION_KEY || "jn_telemetry_edge_secure_2026";
const INGEST_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${TELEMETRY_KEY}`,
  "x-test-env": "true",
};

test("JALNETRA Phase 12 Hardening Verification Suite", async (t) => {

  // =========================================================================
  // REQUIREMENT 1: SENSOR INGESTION SECURITY (BEARER AUTHENTICATION & DEFENSE)
  // =========================================================================
  await t.test("1. Sensor Ingestion Security (Bearer Authentication & Outlier Protection)", async (t2) => {
    
    await t2.test("Rejects requests with missing Authorization token with HTTP 401", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-env": "true" },
        body: JSON.stringify({ sensorId: "sn-rwh-09", metric: "waterLevelM", value: 3.2 }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.includes("Unauthorized") || data.error.includes("Bearer"));
    });

    await t2.test("Rejects requests with invalid Authorization token with HTTP 401", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer totally_wrong_fake_token_12345",
          "x-test-env": "true",
        },
        body: JSON.stringify({ sensorId: "sn-rwh-09", metric: "waterLevelM", value: 3.2 }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.includes("Unauthorized"));
    });

    await t2.test("Accepts valid Authorization token with correct Bearer header", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: INGEST_HEADERS,
        body: JSON.stringify({
          sensorId: "sn-rwh-09",
          metric: "waterLevelM",
          value: 2.85,
          unit: "m",
          batteryPct: 98,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "ingested");
      assert.strictEqual(data.provenance, "MEASURED");
      assert.strictEqual(data.qualityCheck, "PASSED_LEVEL_1_QC");
      assert.ok(data.receiptId.startsWith("rcpt-tel-"));
    });

    await t2.test("Rejects malformed payload with HTTP 400 when authenticated", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: INGEST_HEADERS,
        body: JSON.stringify({ value: 2.85 }), // Missing sensorId
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("rejection") || data.error.includes("sensorId"));
    });

    await t2.test("Rejects outlier physical readings with HTTP 422 when authenticated", async () => {
      // Impossible water level in Kolkata urban sump (> 25.0 meters)
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: INGEST_HEADERS,
        body: JSON.stringify({
          sensorId: "sn-rwh-09",
          metric: "waterLevelM",
          value: 45.0,
          unit: "m",
        }),
      });
      assert.strictEqual(res.status, 422);
      const data = await res.json();
      assert.strictEqual(data.status, "REJECTED_QC");
      assert.strictEqual(data.check, "OUT_OF_BOUNDS_WATER_LEVEL");
    });
  });

  // =========================================================================
  // REQUIREMENT 2: STORM MODE SAFETY FRAMING & PLANNING NON-ACTUATION
  // =========================================================================
  await t.test("2. Storm Mode Safety Framing & Planning Non-Actuation", async () => {
    const stormComponentPath = path.resolve(process.cwd(), "components/sections/StormModeSection.tsx");
    const content = fs.readFileSync(stormComponentPath, "utf-8");

    // Must verify explicit non-actuation disclaimer exists in component source
    assert.ok(
      content.includes("ADVISORY") || content.includes("SIMULATION NOTICE") || content.includes("executive authority"),
      "StormModeSection must contain explicit disclaimer that drawdown is a planning simulation, not direct actuation."
    );
    assert.ok(
      content.includes("Sewerage & Drainage Directorate") || content.includes("KMC"),
      "StormModeSection must reference KMC authority."
    );
  });

  // =========================================================================
  // REQUIREMENT 3: CIRCULARITY INDEX PROVENANCE LABELING
  // =========================================================================
  await t.test("3. Circularity Index Provenance Labeling", async () => {
    const pageComponentPath = path.resolve(process.cwd(), "app/page.tsx");
    const content = fs.readFileSync(pageComponentPath, "utf-8");

    // Must verify provenance labeling in the hero card transition (42 -> 84)
    assert.ok(
      content.includes("BENCHMARK PROJECTION") || content.includes("PROJECTION"),
      "app/page.tsx must explicitly label the 42 -> 84 Circularity Index transition as a BENCHMARK PROJECTION."
    );
  });

  // =========================================================================
  // REQUIREMENT 4: PARAMETERIZE DEMAND APPORTIONMENT & TYPOLOGICAL PROFILES
  // =========================================================================
  await t.test("4. Parameterize Demand Apportionment & Typological Profiles", async (t2) => {
    const mockSite = {
      id: "site-w071-sskm",
      wardNumber: 71,
      wardName: "Bhowanipore / SSKM",
      borough: "Borough IX",
      siteName: "SSKM Hospital Campus",
      siteType: "HOSPITAL_CAMPUS" as any,
      coordinates: [22.5398, 88.3426] as [number, number],
      roofAreaSqM: 32500,
      openGroundAreaSqM: 8600,
      totalCatchmentAreaSqM: 41100,
      runoffCoefficient: 0.9,
      collectionEfficiency: 0.88,
      existingTankCapacityL: 120000,
      currentTankStorageL: 35000,
      dailyNonPotableDemandL: 85000,
      soilInfiltrationRateMmHr: 8.5,
      depthToWaterTableM: 4.2,
      rechargeSuitability: "GOOD" as any,
      provenance: { area: "MEASURED" as any, runoffCoeff: "ASSUMED" as any, demand: "SIMULATED" as any },
    };

    await t2.test("Uses default profile when custom profile is not provided", () => {
      const result = matchNonPotableDemand(mockSite, 50000);
      assert.strictEqual(result.demandProfile.name, DEFAULT_INSTITUTIONAL_PROFILE.name);
      assert.strictEqual(result.demandProfile.toiletFlushingPct, 45);
      assert.strictEqual(result.provenance, "ASSUMED");
      assert.strictEqual(result.waterSuppliedFromHarvestL, 50000);
      assert.strictEqual(result.applications.toiletFlushingL, Math.round(50000 * 0.45));
    });

    await t2.test("Applies custom valid profile correctly (Hospital / Healthcare profile)", () => {
      const result = matchNonPotableDemand(mockSite, 50000, HOSPITAL_CAMPUS_PROFILE);
      assert.strictEqual(result.demandProfile.name, HOSPITAL_CAMPUS_PROFILE.name);
      assert.strictEqual(result.demandProfile.toiletFlushingPct, 50);
      assert.strictEqual(result.demandProfile.coolingHvacPct, 30);
      assert.strictEqual(result.applications.toiletFlushingL, Math.round(50000 * 0.50));
      assert.strictEqual(result.applications.coolingHvacL, Math.round(50000 * 0.30));
    });

    await t2.test("Rejects demand profile whose percentages do not sum to 100%", () => {
      const invalidProfile = {
        name: "Broken Sum Profile",
        toiletFlushingPct: 30,
        landscapeIrrigationPct: 30,
        coolingHvacPct: 10,
        streetCleaningPct: 10, // Sum = 80%, not 100%
        provenance: "ASSUMED" as const,
      };

      const val = validateDemandProfile(invalidProfile);
      assert.strictEqual(val.valid, false);
      assert.ok(val.reason?.includes("must sum to 100%"));

      assert.throws(() => {
        matchNonPotableDemand(mockSite, 50000, invalidProfile);
      }, /Invalid Demand Profile/);
    });

    await t2.test("Rejects negative percentage allocations", () => {
      const invalidProfile = {
        name: "Negative Allocation",
        toiletFlushingPct: -10,
        landscapeIrrigationPct: 60,
        coolingHvacPct: 30,
        streetCleaningPct: 20,
        provenance: "ASSUMED" as const,
      };
      const val = validateDemandProfile(invalidProfile);
      assert.strictEqual(val.valid, false);
      assert.ok(val.reason?.includes("non-negative"));
    });

    await t2.test("Rejects percentage allocations exceeding 1.0 (100%)", () => {
      const invalidProfile = {
        name: "Oversized Allocation",
        toiletFlushingPct: 120,
        landscapeIrrigationPct: 0,
        coolingHvacPct: 0,
        streetCleaningPct: 0,
        provenance: "ASSUMED" as const,
      };
      const val = validateDemandProfile(invalidProfile);
      assert.strictEqual(val.valid, false);
    });

    await t2.test("Handles zero demand gracefully", () => {
      const zeroDemandSite = { ...mockSite, dailyNonPotableDemandL: 0 };
      const result = matchNonPotableDemand(zeroDemandSite, 50000);
      assert.strictEqual(result.totalDailyDemandL, 0);
      assert.strictEqual(result.waterSuppliedFromHarvestL, 0);
      assert.strictEqual(result.demandFulfillmentPct, 100);
    });

    await t2.test("Correctly handles supply lower than demand", () => {
      const result = matchNonPotableDemand(mockSite, 20000);
      assert.strictEqual(result.waterSuppliedFromHarvestL, 20000);
      assert.strictEqual(result.unmetDemandL, 65000);
      assert.strictEqual(result.demandFulfillmentPct, Number(((20000 / 85000) * 100).toFixed(1)));
    });

    await t2.test("Correctly handles supply higher than demand (surplus)", () => {
      const result = matchNonPotableDemand(mockSite, 100000);
      assert.strictEqual(result.waterSuppliedFromHarvestL, 85000);
      assert.strictEqual(result.unmetDemandL, 0);
      assert.strictEqual(result.demandFulfillmentPct, 100);
    });
  });

  // =========================================================================
  // REQUIREMENT 5: SCENARIO CACHE VERSION INVALIDATION & IDENTITY KEY
  // =========================================================================
  await t.test("5. Scenario Cache Version Invalidation & Identity Key", async (t2) => {
    const config = {
      wardNumber: 66,
      rainfallEventMm: 65,
      addedStorageCapacityL: 80000,
      permeablePavementFractionPct: 25,
      activeRechargeWells: true,
      captureEfficiencyBoostPct: 15,
    };

    await t2.test("Produces identical hash for identical configuration + identical versions", () => {
      const hash1 = generateScenarioHash(config, "2.1.0", "1.4.0");
      const hash2 = generateScenarioHash(config, "2.1.0", "1.4.0");
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 24);
    });

    await t2.test("Invalidates cache (produces different hash) when calculationVersion changes", () => {
      const hashV1 = generateScenarioHash(config, "2.0.0", "1.4.0");
      const hashV2 = generateScenarioHash(config, "2.1.0", "1.4.0");
      assert.notStrictEqual(hashV1, hashV2);
    });

    await t2.test("Invalidates cache (produces different hash) when modelVersion changes", () => {
      const hashM1 = generateScenarioHash(config, "2.1.0", "1.3.0");
      const hashM2 = generateScenarioHash(config, "2.1.0", "1.4.0");
      assert.notStrictEqual(hashM1, hashM2);
    });

    await t2.test("Produces different hash when scenario parameter changes", () => {
      const hashBase = generateScenarioHash(config, "2.1.0", "1.4.0");
      const hashDiffRain = generateScenarioHash({ ...config, rainfallEventMm: 70 }, "2.1.0", "1.4.0");
      const hashDiffStorage = generateScenarioHash({ ...config, addedStorageCapacityL: 120000 }, "2.1.0", "1.4.0");
      assert.notStrictEqual(hashBase, hashDiffRain);
      assert.notStrictEqual(hashBase, hashDiffStorage);
    });
  });
});
