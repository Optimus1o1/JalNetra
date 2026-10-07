import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// --- Deterministic Domain Implementations Tested Directly for Mass Conservation & Closure ---

function calculateHarvestableVolume({
  precipitationMm,
  catchmentAreaSqM,
  runoffCoefficient,
  firstFlushDivertedMm = 1.0,
  filterEfficiency = 0.9,
}) {
  const effectiveRainfallMm = Math.max(0, precipitationMm - firstFlushDivertedMm);
  const rawYieldCuM = (effectiveRainfallMm * catchmentAreaSqM * runoffCoefficient) / 1000;
  const filteredVolumeCuM = rawYieldCuM * filterEfficiency;
  return {
    effectiveRainfallMm,
    volumeCuM: filteredVolumeCuM,
    volumeLiters: Math.round(filteredVolumeCuM * 1000),
  };
}

function calculateStorageMassBalance({
  initialStorageL,
  tankCapacityL,
  inflowL,
  reuseDemandL,
  rechargeCapacityL,
  lossFraction = 0.02,
}) {
  // Mass balance: S_{t+1} = S_t + Q_in - Q_reuse - Q_recharge - Losses
  const potentialWater = initialStorageL + inflowL;
  const losses = potentialWater * lossFraction;
  const netAvailable = potentialWater - losses;

  const actualReuse = Math.min(netAvailable, reuseDemandL);
  const remainingAfterReuse = netAvailable - actualReuse;

  const actualRecharge = Math.min(remainingAfterReuse, rechargeCapacityL);
  const storageAfterOutflows = remainingAfterReuse - actualRecharge;

  const finalStorageL = Math.min(tankCapacityL, Math.max(0, storageAfterOutflows));
  const overflowL = Math.max(0, storageAfterOutflows - tankCapacityL);

  return {
    initialStorageL,
    tankCapacityL,
    inflowL,
    actualReuseL: actualReuse,
    actualRechargeL: actualRecharge,
    lossesL: losses,
    finalStorageL,
    overflowL,
    closureDelta: Math.abs(
      potentialWater - (finalStorageL + actualReuse + actualRecharge + losses + overflowL)
    ),
  };
}

function calculateDemandBreakdown(totalDemandL, availableSupplyL) {
  const allocationShares = {
    toiletFlushing: 0.45,
    landscapeIrrigation: 0.25,
    hvacCooling: 0.15,
    streetWashing: 0.15,
  };

  const totalShare = Object.values(allocationShares).reduce((a, b) => a + b, 0);
  const satisfiedTotalL = Math.min(totalDemandL, availableSupplyL);
  const unmetDemandL = Math.max(0, totalDemandL - satisfiedTotalL);

  const breakdown = {
    toiletFlushingL: Math.round(satisfiedTotalL * allocationShares.toiletFlushing),
    landscapeIrrigationL: Math.round(satisfiedTotalL * allocationShares.landscapeIrrigation),
    hvacCoolingL: Math.round(satisfiedTotalL * allocationShares.hvacCooling),
    streetWashingL: Math.round(satisfiedTotalL * allocationShares.streetWashing),
  };

  return {
    totalDemandL,
    availableSupplyL,
    satisfiedTotalL,
    unmetDemandL,
    totalShare,
    breakdown,
  };
}

function evaluateRechargeSuitability({
  soilType,
  depthToWaterTableM,
  infiltrationRateMmHr,
  subsurfaceKsat,
}) {
  let score = 0;
  if (depthToWaterTableM >= 10) score += 35;
  else if (depthToWaterTableM >= 5) score += 25;
  else if (depthToWaterTableM >= 2) score += 10;
  else score += 0; // Water table too shallow; risk of waterlogging

  if (infiltrationRateMmHr >= 30) score += 35;
  else if (infiltrationRateMmHr >= 15) score += 25;
  else if (infiltrationRateMmHr >= 5) score += 15;
  else score += 5;

  if (soilType === "sandy_loam") score += 30;
  else if (soilType === "alluvial_silt") score += 20;
  else if (soilType === "silty_clay") score += 10;
  else score += 5;

  const suitabilityClass =
    score >= 75 ? "EXCELLENT" : score >= 55 ? "MODERATE" : score >= 35 ? "MARGINAL" : "UNSUITABLE";

  return { score, suitabilityClass, vadoseClearanceOk: depthToWaterTableM >= 2.0 };
}

function calculateWaterCircularityScore({
  harvestFraction,
  reuseFraction,
  rechargeFraction,
  runoffReductionFraction,
}) {
  const score =
    harvestFraction * 30 +
    reuseFraction * 30 +
    rechargeFraction * 20 +
    runoffReductionFraction * 20;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function hashScenario(params) {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

describe("JALNETRA Scientific Integrity & Mass Conservation Test Suite", () => {
  // 1. Rainwater Harvest Formula & Bounds
  describe("1. Deterministic Rainwater Harvest Formula ($V = P \\times A \\times C \\times \\eta$)", () => {
    test("Zero precipitation yields strictly zero harvestable volume", () => {
      const res = calculateHarvestableVolume({
        precipitationMm: 0,
        catchmentAreaSqM: 10000,
        runoffCoefficient: 0.85,
      });
      assert.equal(res.volumeLiters, 0);
      assert.equal(res.effectiveRainfallMm, 0);
    });

    test("Precipitation below first-flush threshold yields zero harvestable volume", () => {
      const res = calculateHarvestableVolume({
        precipitationMm: 0.8,
        catchmentAreaSqM: 10000,
        runoffCoefficient: 0.85,
        firstFlushDivertedMm: 1.0,
      });
      assert.equal(res.volumeLiters, 0);
      assert.equal(res.effectiveRainfallMm, 0);
    });

    test("Harvest volume scales linearly with catchment area", () => {
      const base = calculateHarvestableVolume({
        precipitationMm: 50,
        catchmentAreaSqM: 5000,
        runoffCoefficient: 0.85,
        firstFlushDivertedMm: 1.0,
        filterEfficiency: 0.9,
      });
      const doubleArea = calculateHarvestableVolume({
        precipitationMm: 50,
        catchmentAreaSqM: 10000,
        runoffCoefficient: 0.85,
        firstFlushDivertedMm: 1.0,
        filterEfficiency: 0.9,
      });
      assert.equal(doubleArea.volumeLiters, base.volumeLiters * 2);
    });

    test("Harvest volume conforms strictly to physical unit dimensions (1mm over 1m² = 1L)", () => {
      // 101mm rainfall - 1mm first flush = 100mm effective.
      // 100mm over 1000 m² = 100 m³ = 100,000 Liters.
      // With C=1.0 and eta=1.0, volume must equal exactly 100,000 Liters.
      const res = calculateHarvestableVolume({
        precipitationMm: 101,
        catchmentAreaSqM: 1000,
        runoffCoefficient: 1.0,
        firstFlushDivertedMm: 1.0,
        filterEfficiency: 1.0,
      });
      assert.equal(res.volumeLiters, 100000);
    });
  });

  // 2. Mass Balance Closure & Invariants
  describe("2. Hydrodynamic Mass Balance Closure & Invariants ($S_{t+1} \\in [0, C]$)", () => {
    test("Final storage never exceeds tank capacity C under heavy storm inflow", () => {
      const res = calculateStorageMassBalance({
        initialStorageL: 400000,
        tankCapacityL: 500000,
        inflowL: 1000000, // Inflow exceeds remaining capacity
        reuseDemandL: 50000,
        rechargeCapacityL: 20000,
        lossFraction: 0.01,
      });
      assert.ok(res.finalStorageL <= res.tankCapacityL, "Storage exceeded tank capacity!");
      assert.ok(res.overflowL > 0, "Expected overflow not recorded!");
    });

    test("Storage is strictly non-negative under extreme demand deficits", () => {
      const res = calculateStorageMassBalance({
        initialStorageL: 50000,
        tankCapacityL: 500000,
        inflowL: 10000,
        reuseDemandL: 200000, // Demand vastly exceeds available water
        rechargeCapacityL: 100000,
        lossFraction: 0.02,
      });
      assert.ok(res.finalStorageL >= 0, "Storage was negative!");
      assert.ok(res.actualReuseL <= 60000, "Reuse extracted non-existent water!");
    });

    test("Total Mass Balance Closure is strictly conserved within numerical tolerance (closure delta < 1e-4)", () => {
      const res = calculateStorageMassBalance({
        initialStorageL: 250000,
        tankCapacityL: 500000,
        inflowL: 400000,
        reuseDemandL: 120000,
        rechargeCapacityL: 80000,
        lossFraction: 0.02,
      });
      assert.ok(res.closureDelta < 0.0001, `Mass conservation violated! Delta: ${res.closureDelta}`);
    });
  });

  // 3. Non-Potable Demand Allocation
  describe("3. Non-Potable Demand Matching Invariants", () => {
    test("Demand shares sum to exactly 1.0 (100% categorical closure)", () => {
      const res = calculateDemandBreakdown(100000, 80000);
      assert.equal(res.totalShare, 1.0);
    });

    test("Satisfied volume never exceeds available supply", () => {
      const demand = 150000;
      const supply = 90000;
      const res = calculateDemandBreakdown(demand, supply);
      assert.equal(res.satisfiedTotalL, supply);
      assert.equal(res.unmetDemandL, 60000);
    });

    test("Satisfied volume never exceeds total demand when surplus exists", () => {
      const demand = 50000;
      const supply = 200000;
      const res = calculateDemandBreakdown(demand, supply);
      assert.equal(res.satisfiedTotalL, demand);
      assert.equal(res.unmetDemandL, 0);
    });
  });

  // 4. Hydrogeological Recharge Index
  describe("4. Recharge Suitability & Hydrogeological Bounds", () => {
    test("Shallow water table (<2m) flags vadose clearance violation", () => {
      const res = evaluateRechargeSuitability({
        soilType: "alluvial_silt",
        depthToWaterTableM: 1.4, // Shallow water table
        infiltrationRateMmHr: 12,
        subsurfaceKsat: 0.0001,
      });
      assert.equal(res.vadoseClearanceOk, false);
      assert.ok(res.score < 55);
    });

    test("Deep water table and sandy loam soil achieves EXCELLENT suitability class", () => {
      const res = evaluateRechargeSuitability({
        soilType: "sandy_loam",
        depthToWaterTableM: 12.0,
        infiltrationRateMmHr: 35,
        subsurfaceKsat: 0.0005,
      });
      assert.equal(res.vadoseClearanceOk, true);
      assert.equal(res.suitabilityClass, "EXCELLENT");
      assert.ok(res.score >= 75);
    });
  });

  // 5. Water Circularity Score & Monotonicity
  describe("5. Water Circularity Composite Index Invariants", () => {
    test("Circularity score is strictly bounded within [0, 100]", () => {
      const minScore = calculateWaterCircularityScore({
        harvestFraction: 0,
        reuseFraction: 0,
        rechargeFraction: 0,
        runoffReductionFraction: 0,
      });
      const maxScore = calculateWaterCircularityScore({
        harvestFraction: 1,
        reuseFraction: 1,
        rechargeFraction: 1,
        runoffReductionFraction: 1,
      });
      assert.equal(minScore, 0);
      assert.equal(maxScore, 100);
    });

    test("Intervention scenario circularity strictly exceeds baseline linear drainage", () => {
      const baselineScore = calculateWaterCircularityScore({
        harvestFraction: 0.15,
        reuseFraction: 0.1,
        rechargeFraction: 0.05,
        runoffReductionFraction: 0.12,
      });
      const interventionScore = calculateWaterCircularityScore({
        harvestFraction: 0.85,
        reuseFraction: 0.8,
        rechargeFraction: 0.75,
        runoffReductionFraction: 0.88,
      });
      assert.ok(
        interventionScore > baselineScore,
        `Expected intervention (${interventionScore}) to exceed baseline (${baselineScore})`
      );
      assert.ok(baselineScore <= 45);
      assert.ok(interventionScore >= 80);
    });
  });

  // 6. Scenario Cache SHA-256 Hashing & Idempotency
  describe("6. Scenario Cache SHA-256 Hashing & Invariance", () => {
    test("Identical scenario parameters produce exact identical SHA-256 hashes (Idempotency)", () => {
      const scenarioA = {
        wardNumber: 66,
        rainfallMultiplier: 1.5,
        storageCapacityM3: 500,
        demandReuseM3Day: 120,
      };
      const scenarioB = {
        demandReuseM3Day: 120,
        storageCapacityM3: 500,
        rainfallMultiplier: 1.5,
        wardNumber: 66,
      };
      const hashA = hashScenario(scenarioA);
      const hashB = hashScenario(scenarioB);
      assert.equal(hashA, hashB);
    });

    test("Perturbation of parameters produces distinct cryptographic hashes (Collision Resistance)", () => {
      const scenarioA = { wardNumber: 66, rainfallMultiplier: 1.5 };
      const scenarioB = { wardNumber: 66, rainfallMultiplier: 1.51 };
      const hashA = hashScenario(scenarioA);
      const hashB = hashScenario(scenarioB);
      assert.notEqual(hashA, hashB);
    });
  });
});
