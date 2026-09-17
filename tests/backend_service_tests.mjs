import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

describe("JalNetra Global v2.0 — Production Backend Services & APIs", () => {
  // ==========================================
  // 1. TELEMETRY INGESTION & QUALITY CONTROL
  // ==========================================
  describe("1. IoT Telemetry Quality Control & Boundary Checks", () => {
    it("Rejects missing sensorId with HTTP 400", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: 3.5 }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes("Validation failed") || data.error.includes("sensorId"));
    });

    it("Rejects impossible water level (>25.0m) with HTTP 422", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensorId: "SEN-KMC-066-SUMP",
          metric: "waterLevelM",
          value: 48.2,
          unit: "m",
        }),
      });
      assert.equal(res.status, 422);
      const data = await res.json();
      assert.ok(data.error.includes("rejected") || data.error.includes("impossible"));
    });

    it("Rejects negative water level (<0.0m) with HTTP 422", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensorId: "SEN-KMC-066-SUMP",
          metric: "waterLevelM",
          value: -4.1,
          unit: "m",
        }),
      });
      assert.equal(res.status, 422);
    });

    it("Accepts valid telemetry and returns ingestion receipt", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensorId: "SEN-KMC-066-SUMP",
          metric: "waterLevelM",
          value: 3.42,
          unit: "m",
          batteryPct: 98,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ingested");
      assert.ok(data.receiptId);
      assert.equal(data.sensorId, "SEN-KMC-066-SUMP");
    });
  });

  // ==========================================
  // 2. TWIN RISK & TREESHAP EXPLAINABILITY
  // ==========================================
  describe("2. Twin Risk & TreeSHAP Attribution Decomposition", () => {
    it("GET /api/v1/twin/cells/[id] returns TreeSHAP decomposition and risk indices", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/twin/cells/cell-w066`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.equal(data.cell.wardNumber, 66);
      assert.ok(data.explainability);
      assert.equal(data.explainability.framework, "TreeSHAP Local Attribution Decomposition");
      assert.ok(data.explainability.totalFactors >= 3);
      assert.ok(data.explainability.primaryRiskDriver.length > 0);
    });

    it("GET /api/v1/twin/cells/[id] returns 404 for non-existent ward", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/twin/cells/invalid-ward-999`);
      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // 3. HOOGHLY TIDAL HYDRODYNAMICS & SLUICE LOCK
  // ==========================================
  describe("3. Hooghly Estuary Tidal Hydrodynamics & Sluice Gate Interlocks", () => {
    it("GET /api/v1/water/forecast returns live stage, surge warning, and lock state", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/water/forecast`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(Array.isArray(data.sensors));
      assert.ok(data.sensors.length >= 8);
      assert.ok(data.tidalDynamics);
      assert.ok(data.tidalDynamics.predictedHighTideMeters >= 5.0);

      // Verify Sluice lock mechanism
      if (data.tidalDynamics.sluiceInterlockActive) {
        assert.ok(data.tidalDynamics.gateStatus);
        assert.equal(data.tidalDynamics.gateStatus.sluice04, "LOCKED_PREVENT_BACKFLOW");
      }
    });
  });

  // ==========================================
  // 4. INCIDENT ALERTS & CIVIL DEFENSE TRIAGE
  // ==========================================
  describe("4. Decision Triage & Incident Dispatch Protocol", () => {
    it("GET /api/v1/alerts returns active incidents and filters by severity", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/alerts`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(Array.isArray(data.alerts));
      assert.ok(data.alerts.length >= 2);

      const critRes = await fetch(`${BASE_URL}/api/v1/alerts?severity=critical`);
      const critData = await critRes.json();
      assert.ok(critData.alerts.every((a) => a.severity.toLowerCase() === "critical"));
    });

    it("POST /api/v1/alerts records operator acknowledgment and dispatch order", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: "ALT-CCU-W066",
          operatorName: "OPS_DIRECTOR_ANIKET",
          actionTaken: "Dispatched 4 auxiliary diesel turbines to Topsia basin.",
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.equal(data.updatedAlert.status, "acknowledged");
    });
  });

  // ==========================================
  // 5. HYDRODYNAMIC SIMULATION ENGINE & LOGGING
  // ==========================================
  describe("5. Hydrodynamic Simulation Logging & Avoided Loss Accounting", () => {
    it("POST /api/v1/simulation computes scenario and generates traceable runId", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfallMultiplier: 1.6,
          durationHours: 6,
          drainageEfficiencyPct: -25,
          tidalSurgeMeters: 1.2,
          emergencyPumpsActive: true,
          sluiceGatesAutomated: true,
          temporaryBundsDeployed: true,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(data.runId);
      assert.ok(data.simulation.sparedPopulation > 0);
      assert.ok(data.simulation.avoidedLossCrores > 0);
    });
  });

  // ==========================================
  // 6. ADMINISTRATIVE SEED & DATABASE SYNC
  // ==========================================
  describe("6. Administrative Database Synchronization & Seed Endpoint", () => {
    it("GET /api/v1/admin/seed returns readiness status and DB connection indicator", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/seed`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ready");
      assert.equal(typeof data.databaseConnected, "boolean");
    });

    it("POST /api/v1/admin/seed synchronizes baseline data", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/seed`, { method: "POST" });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.status === "success" || data.status === "operational_memory_active");
    });
  });

  // ==========================================
  // 7. CUSTOM COLAB MODEL & LIVE INFERENCE
  // ==========================================
  describe("7. Custom Colab Model Ingestion & Live Inference", () => {
    it("GET /api/v1/models/custom returns model metadata and benchmark inference", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/models/custom`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(data.model);
      assert.equal(data.model.format, "jalnetra_custom_model_v1");
      assert.ok(typeof data.benchmarkInference?.predictedDepthCm === "number");
    });

    it("POST /api/v1/models/custom executes live hydraulic inference", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/models/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "infer",
          inputs: {
            rainfall_rate_mmh: 90,
            elevation_m: 2.8,
            tidal_stage_m: 4.4,
            canal_silt_pct: 70,
            active_turbines: 2,
          },
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(data.result.predictedDepthCm > 0);
      assert.ok(["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(data.result.riskCategory));
      assert.ok(data.result.crpsConfidenceBand);
    });

    it("POST /api/v1/models/custom rejects invalid model format with HTTP 422", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/models/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "invalid_unsupported_format",
        }),
      });
      assert.equal(res.status, 422);
    });
  });
});
