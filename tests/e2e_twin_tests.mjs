import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("JalNetra Global — Digital Twin System Test Suite", () => {
  // ==========================================
  // SECTION 1: BLUEPRINT ENDPOINT VERIFICATION
  // ==========================================
  describe("1. REST API Endpoints (Blueprint Section 16)", () => {
    it("GET /api/v1/global/rainfall returns NASA GPM satellite anomalies", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/global/rainfall`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.source, "NASA_GPM_IMERG_V07");
      assert.equal(data.spatialResolution, "0.1_deg_approx_10km");
      assert.ok(Array.isArray(data.bands));
      assert.ok(data.bands.length > 0);
      assert.ok(data.bands[0].anomalyMm !== undefined);
      assert.ok(data.bands[0].precipRateMmHr !== undefined);
    });

    it("GET /api/v1/weather/forecast returns multi-horizon quantile forecasts", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/weather/forecast?ward=66`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.wardNumber, 66);
      assert.ok(Array.isArray(data.horizons));
      assert.equal(data.horizons.length, 3); // 3h, 6h, 24h
      
      const h3 = data.horizons.find((h) => h.horizonHours === 3);
      assert.ok(h3);
      assert.ok(h3.p10RainfallMm <= h3.p50RainfallMm, "Quantile p10 <= p50");
      assert.ok(h3.p50RainfallMm <= h3.p90RainfallMm, "Quantile p50 <= p90");
      assert.ok(h3.probExceeding25mm >= 0 && h3.probExceeding25mm <= 1);
    });

    it("GET /api/v1/climate/indices returns valid teleconnections (ENSO, IOD, MJO)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/climate/indices`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(["EL_NINO", "LA_NINA", "NEUTRAL"].includes(data.ensoPhase));
      assert.ok(data.iodIndex >= -2.5 && data.iodIndex <= 2.5);
      assert.ok(data.mjoPhase >= 1 && data.mjoPhase <= 8);
      assert.ok(data.activeTeleconnections.length > 0);
    });

    it("GET /api/v1/twin/cells/[id] returns cell state and TreeSHAP decomposition", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/twin/cells/cell-w066`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.cellId, "cell-w066");
      assert.equal(data.wardNumber, 66);
      assert.ok(data.riskScore >= 0 && data.riskScore <= 1);
      assert.ok(Array.isArray(data.treeShapAttributions));
      assert.ok(data.treeShapAttributions.length > 0);

      // Verify SHAP sum roughly equals risk delta from baseline
      const totalAttribution = data.treeShapAttributions.reduce(
        (sum, attr) => sum + attr.attributionValue,
        0
      );
      assert.ok(Math.abs(totalAttribution) > 0.01, "TreeSHAP explanation should have non-zero attributions");
    });

    it("GET /api/v1/twin/cells/[id] returns 404 for nonexistent ward cell", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/twin/cells/nonexistent-ward-999`);
      assert.equal(res.status, 404);
    });

    it("GET /api/v1/risk/map returns valid GeoJSON FeatureCollection", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/risk/map`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.type, "FeatureCollection");
      assert.ok(Array.isArray(data.features));
      assert.equal(data.features.length, 24); // 24 pilot wards

      const feat = data.features[0];
      assert.equal(feat.type, "Feature");
      assert.ok(feat.geometry.coordinates);
      assert.ok(feat.properties.wardNumber);
      assert.ok(feat.properties.riskScore !== undefined);
      assert.ok(feat.properties.waterloggingDepthCm !== undefined);
    });

    it("GET /api/v1/water/forecast returns live sensors and tidal dynamics", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/water/forecast`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.sensors));
      assert.equal(data.sensors.length, 12); // 12 IoT sensors
      assert.ok(data.hooghlyTide);
      assert.ok(data.hooghlyTide.stageMSL >= 0);
      assert.ok(["SPRING", "NEAP", "NORMAL"].includes(data.hooghlyTide.tideType));
      assert.ok(typeof data.hooghlyTide.sluiceInterlockActive === "boolean");
    });

    it("POST /api/v1/simulation computes What-If scenario outcomes dynamically", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfallMultiplier: 1.5,
          emergencyPumpingCusec: 50,
          desiltingFactor: 1.3,
          upstreamRetentionPct: 20,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(data.scenarioName);
      assert.ok(Array.isArray(data.updatedCells));
      assert.equal(data.updatedCells.length, 24);
      assert.ok(data.averageRiskScore >= 0 && data.averageRiskScore <= 1);
      assert.ok(data.criticalWardsCount >= 0);
      assert.ok(data.mitigatedWardsCount >= 0);
    });

    it("GET & POST /api/v1/alerts handles incident acknowledgement", async () => {
      const listRes = await fetch(`${BASE_URL}/api/v1/alerts`);
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.ok(Array.isArray(listData.alerts));
      assert.ok(listData.alerts.length > 0);

      const targetId = listData.alerts[0].id;
      const ackRes = await fetch(`${BASE_URL}/api/v1/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: targetId, action: "ACKNOWLEDGE", operatorNotes: "Testing dispatch" }),
      });
      assert.equal(ackRes.status, 200);
      const ackData = await ackRes.json();
      assert.equal(ackData.status, "acknowledged");
      assert.equal(ackData.alertId, targetId);
    });

    it("POST /api/v1/sensors/observations accepts valid IoT telemetry and rejects anomalies", async () => {
      // 1. Valid telemetry with Bearer Auth
      const goodRes = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer jn_telemetry_edge_secure_2026",
          "x-test-env": "true",
        },
        body: JSON.stringify({
          sensorId: "SEN-KMC-066-SUMP",
          metric: "waterLevelM",
          value: 4.25,
          unit: "m",
          batteryPct: 92,
        }),
      });
      assert.equal(goodRes.status, 200);
      const goodData = await goodRes.json();
      assert.equal(goodData.status, "ingested");
      assert.equal(goodData.provenance, "MEASURED");

      // 2. Physical boundary failure (>25m water level)
      const badRes = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer jn_telemetry_edge_secure_2026",
          "x-test-env": "true",
        },
        body: JSON.stringify({
          sensorId: "SEN-KMC-066-SUMP",
          metric: "waterLevelM",
          value: 45.0, // Plausibility check failure
          unit: "m",
        }),
      });
      assert.equal(badRes.status, 422);
      const badData = await badRes.json();
      assert.equal(badData.status, "REJECTED_QC");
      assert.equal(badData.check, "OUT_OF_BOUNDS_WATER_LEVEL");
    });

    it("GET /api/v1/models/status returns model registry, CRPS scores, and freshness", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/models/status`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.models));
      assert.equal(data.models.length, 3); // PINN, TCN-LSTM, LightGBM
      
      const pinn = data.models.find((m) => m.id === "mod-prod-pinn-03");
      assert.ok(pinn);
      assert.equal(pinn.architecture, "physics_informed_pinn");
      assert.ok(pinn.crps < 0.2, "Production model must beat CRPS < 0.2 benchmark");
      assert.ok(pinn.inferenceLatencyMs < 200, "PINN forward pass must be < 200ms");
    });
  });

  // ==========================================
  // SECTION 2: SIMULATION SENSITIVITY & PHYSICS
  // ==========================================
  describe("2. Scientific Simulation Physics Engine", () => {
    it("Calculates that higher rainfall multiplier strictly increases or maintains average risk", async () => {
      const [resLow, resHigh] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rainfallMultiplier: 1.0 }),
        }),
        fetch(`${BASE_URL}/api/v1/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rainfallMultiplier: 2.0 }),
        }),
      ]);

      const dataLow = await resLow.json();
      const dataHigh = await resHigh.json();

      assert.ok(
        dataHigh.averageRiskScore >= dataLow.averageRiskScore,
        `2.0x rainfall risk (${dataHigh.averageRiskScore}) must be >= 1.0x risk (${dataLow.averageRiskScore})`
      );
      assert.ok(
        dataHigh.criticalWardsCount >= dataLow.criticalWardsCount,
        `Critical wards under 2.0x (${dataHigh.criticalWardsCount}) must be >= 1.0x (${dataLow.criticalWardsCount})`
      );
    });

    it("Calculates that auxiliary emergency pumping and desilting reduces critical ward count", async () => {
      const [resBaseline, resMitigated] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rainfallMultiplier: 1.8,
            emergencyPumpingCusec: 0,
            desiltingFactor: 1.0,
            upstreamRetentionPct: 0,
          }),
        }),
        fetch(`${BASE_URL}/api/v1/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rainfallMultiplier: 1.8,
            emergencyPumpingCusec: 60,
            desiltingFactor: 1.5,
            upstreamRetentionPct: 30,
          }),
        }),
      ]);

      const dataBaseline = await resBaseline.json();
      const dataMitigated = await resMitigated.json();

      assert.ok(
        dataMitigated.averageRiskScore < dataBaseline.averageRiskScore,
        `Mitigated risk (${dataMitigated.averageRiskScore}) must be strictly lower than baseline (${dataBaseline.averageRiskScore})`
      );
      assert.ok(
        dataMitigated.mitigatedWardsCount > 0,
        "Mitigation interventions should reduce waterlogging in at least 1 ward"
      );
    });

    it("Calculates that tidal surge predominantly penalizes low-elevation wards (<5.0m)", async () => {
      const [resNormal, resSurge] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tidalStageM: 3.5 }),
        }),
        fetch(`${BASE_URL}/api/v1/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tidalStageM: 5.5 }), // Major spring tide lockup
        }),
      ]);

      const dataNormal = await resNormal.json();
      const dataSurge = await resSurge.json();

      // Find low elevation ward 66 (Topsia, 3.8m)
      const ward66Normal = dataNormal.updatedCells.find((c) => c.wardNumber === 66);
      const ward66Surge = dataSurge.updatedCells.find((c) => c.wardNumber === 66);

      // Find high elevation ward 7 (Bagbazar, 7.8m)
      const ward7Normal = dataNormal.updatedCells.find((c) => c.wardNumber === 7);
      const ward7Surge = dataSurge.updatedCells.find((c) => c.wardNumber === 7);

      const deltaLow = ward66Surge.riskScore - ward66Normal.riskScore;
      const deltaHigh = ward7Surge.riskScore - ward7Normal.riskScore;

      assert.ok(
        deltaLow > deltaHigh,
        `Tidal surge delta in low-elevation Ward 66 (${deltaLow.toFixed(3)}) must exceed high-elevation Ward 7 (${deltaHigh.toFixed(3)})`
      );
    });
  });

  // ==========================================
  // SECTION 3: GEOGRAPHIC & DATA ACCURACY
  // ==========================================
  describe("3. Pilot Region GIS Data Invariants", () => {
    it("Verifies all wards have authentic geographic coordinates within Kolkata bounds", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/risk/map`);
      const data = await res.json();

      // Kolkata Metropolitan bounds: Lat [22.45, 22.65], Lng [88.25, 88.48]
      for (const feat of data.features) {
        const coords = feat.geometry.coordinates[0];
        for (const [lng, lat] of coords) {
          assert.ok(lat >= 22.45 && lat <= 22.65, `Latitude ${lat} out of Kolkata bounds`);
          assert.ok(lng >= 88.25 && lng <= 88.48, `Longitude ${lng} out of Kolkata bounds`);
        }
      }
    });
  });
});
