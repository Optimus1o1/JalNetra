import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("JalNetra Global — Digital Twin System Test Suite", () => {
  // ==========================================
  // SUITE 1: REST API INTEGRATION TESTS
  // ==========================================
  describe("1. REST API Endpoints (Blueprint Section 16)", () => {
    it("GET /api/v1/global/rainfall returns NASA GPM satellite anomalies", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/global/rainfall`);
      assert.equal(res.status, 200, "Should return HTTP 200");
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(Array.isArray(data.globalAnomalies), "Should contain globalAnomalies array");
      assert.ok(data.globalAnomalies.length >= 4, "Should have at least 4 global regions");

      // Verify Bay of Bengal anomaly is present
      const bob = data.globalAnomalies.find((a) => a.region.includes("Bay of Bengal"));
      assert.ok(bob, "Bay of Bengal anomaly must exist");
      assert.ok(bob.precipitationRateMmH > 0, "Precipitation rate must be positive");
    });

    it("GET /api/v1/weather/forecast returns multi-horizon quantile forecasts", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/weather/forecast`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(Array.isArray(data.forecasts), "Should contain forecasts array");
      assert.equal(data.forecasts.length, 6, "Should contain exactly 6 multi-horizon intervals");

      // Verify quantile ordering rule: P10 <= P50 <= P90
      for (const fc of data.forecasts) {
        assert.ok(
          fc.p10 <= fc.p50,
          `P10 (${fc.p10}) must be <= P50 (${fc.p50}) for horizon ${fc.horizon}`
        );
        assert.ok(
          fc.p50 <= fc.p90,
          `P50 (${fc.p50}) must be <= P90 (${fc.p90}) for horizon ${fc.horizon}`
        );
        assert.ok(
          fc.probabilityOfPrecip >= 0 && fc.probabilityOfPrecip <= 100,
          "PoP must be between 0% and 100%"
        );
      }
    });

    it("GET /api/v1/climate/indices returns valid teleconnections (ENSO, IOD, MJO)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/climate/indices`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");

      const { enso, iod, mjo } = data.climateIndices;
      assert.ok(enso, "ENSO index required");
      assert.ok(typeof enso.nino34AnomalyC === "number", "Niño 3.4 must be numeric");
      assert.ok(iod, "IOD index required");
      assert.ok(typeof iod.dmiAnomalyC === "number", "DMI must be numeric");
      assert.ok(mjo, "MJO index required");
      assert.ok(mjo.phase >= 1 && mjo.phase <= 8, "MJO phase must be between 1 and 8");
    });

    it("GET /api/v1/twin/cells/[id] returns cell state and TreeSHAP decomposition", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/twin/cells/cell-w066`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.equal(data.cell.wardNumber, 66);
      assert.equal(data.cell.wardName, "Topsia / Tiljala Wetlands");

      // Verify TreeSHAP local explainability factors
      assert.ok(Array.isArray(data.cell.shapFactors), "Must contain shapFactors");
      assert.ok(data.cell.shapFactors.length >= 3, "Must have at least 3 SHAP drivers");
      const sum = data.cell.shapFactors.reduce((acc, f) => acc + f.contribution, 0);
      assert.equal(sum, 100, "SHAP factor contributions must sum to 100%");
    });

    it("GET /api/v1/twin/cells/[id] returns 404 for nonexistent ward cell", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/twin/cells/non-existent-ward-9999`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.ok(data.error, "Must return error message");
    });

    it("GET /api/v1/risk/map returns valid GeoJSON FeatureCollection", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/risk/map`);
      assert.equal(res.status, 200);
      const geojson = await res.json();
      assert.equal(geojson.type, "FeatureCollection");
      assert.ok(Array.isArray(geojson.features), "Must have features array");
      assert.equal(geojson.features.length, 12, "Must contain 12 pilot ward polygons");

      for (const f of geojson.features) {
        assert.equal(f.type, "Feature");
        assert.equal(f.geometry.type, "Point");
        assert.ok(Array.isArray(f.geometry.coordinates), "Coordinates must be array");
        assert.ok(f.properties.riskScore >= 0 && f.properties.riskScore <= 1, "Risk must be [0,1]");
      }
    });

    it("GET /api/v1/water/forecast returns live sensors and tidal dynamics", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/water/forecast`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(Array.isArray(data.sensors), "Must contain sensors array");
      assert.equal(data.sensors.length, 8, "Must contain 8 IoT sensor nodes");

      // Verify Hooghly river tidal stage gauge
      const hooghly = data.sensors.find((s) => s.stationCode === "HG-OUTRAM-01");
      assert.ok(hooghly, "HG-OUTRAM-01 river gauge must exist");
      assert.ok(hooghly.waterLevelM > 0, "Water level must be positive");
      assert.ok(hooghly.dangerLevelM > hooghly.warningLevelM, "Danger level > Warning level");
    });

    it("POST /api/v1/simulation computes What-If scenario outcomes dynamically", async () => {
      const payload = {
        rainfallMultiplier: 1.8,
        durationHours: 6,
        drainageEfficiencyPct: -25,
        tidalSurgeMeters: 1.2,
        emergencyPumpsActive: true,
        sluiceGatesAutomated: true,
        temporaryBundsDeployed: true,
      };

      const res = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(data.simulation.summary, "Must return simulation summary");
      assert.ok(typeof data.simulation.summary.scenarioAvgRisk === "number");
      assert.ok(data.simulation.summary.criticalWardsCount >= 0);
      assert.ok(Array.isArray(data.simulation.wardDeltas), "Must return ward deltas");
      assert.equal(data.simulation.wardDeltas.length, 12);
    });

    it("GET & POST /api/v1/alerts handles incident acknowledgement", async () => {
      const getRes = await fetch(`${BASE_URL}/api/v1/alerts`);
      assert.equal(getRes.status, 200);
      const getData = await getRes.json();
      assert.ok(getData.totalAlerts >= 4);

      const targetAlert = getData.alerts[0];
      assert.ok(targetAlert, "Alert must exist");

      // Acknowledge this alert
      const postRes = await fetch(`${BASE_URL}/api/v1/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: targetAlert.id,
          operatorName: "QA Automated Test Suite",
        }),
      });

      assert.equal(postRes.status, 200);
      const postData = await postRes.json();
      assert.equal(postData.status, "success");
      assert.equal(postData.updatedAlert.status, "acknowledged");
      assert.equal(postData.updatedAlert.acknowledgedBy, "QA Automated Test Suite");
    });

    it("POST /api/v1/sensors/observations accepts valid IoT telemetry and rejects anomalies", async () => {
      // 1. Valid telemetry
      const validRes = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensorId: "sn-hg-01",
          timestamp: new Date().toISOString(),
          metric: "waterLevelM",
          value: 5.62,
          unit: "meters",
          qualityFlag: "PASSED_BOUNDARY_CHECKS",
        }),
      });
      assert.equal(validRes.status, 200);
      const validData = await validRes.json();
      assert.equal(validData.status, "ingested");
      assert.ok(validData.receiptId);

      // 2. Impossible physical reading (>25m water level in urban drainage) -> 422
      const invalidRes = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensorId: "sn-hg-01",
          timestamp: new Date().toISOString(),
          metric: "waterLevelM",
          value: 84.5, // impossible spike
        }),
      });
      assert.equal(invalidRes.status, 422, "Should reject impossible sensor reading with 422");

      // 3. Missing sensorId -> 400
      const missingRes = await fetch(`${BASE_URL}/api/v1/sensors/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: 5.2 }),
      });
      assert.equal(missingRes.status, 400, "Should reject missing sensorId with 400");
    });

    it("GET /api/v1/models/status returns model registry, CRPS scores, and freshness", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/models/status`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.equal(data.championModel, "JalNetra Spatiotemporal PINN v2.4.1");
      assert.ok(Array.isArray(data.models), "Must contain models array");

      const champion = data.models.find((m) => m.status === "active_production");
      assert.ok(champion, "Champion model must be active");
      assert.ok(champion.metrics.crpsScore < 0.25, "PINN CRPS score must be calibrated (<0.25)");
      assert.ok(champion.metrics.brierScore < 0.1, "Brier score must be < 0.10");
      assert.ok(champion.metrics.spatialIoU > 0.8, "Spatial IoU must be > 80%");
      assert.ok(champion.metrics.falseAlertRate < 0.1, "False alert rate must be < 10%");
    });
  });

  // ==========================================
  // SUITE 2: SCIENTIFIC SIMULATION ENGINE TESTS
  // ==========================================
  describe("2. Scientific Simulation Physics Engine", () => {
    it("Calculates that higher rainfall multiplier strictly increases or maintains average risk", async () => {
      const resLow = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainfallMultiplier: 0.8, durationHours: 3 }),
      });
      const dataLow = await resLow.json();

      const resHigh = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainfallMultiplier: 2.2, durationHours: 3 }),
      });
      const dataHigh = await resHigh.json();

      assert.ok(
        dataHigh.simulation.summary.scenarioAvgRisk >= dataLow.simulation.summary.scenarioAvgRisk,
        "Higher rainfall must produce greater or equal average basin risk"
      );
    });

    it("Calculates that auxiliary emergency pumping and desilting reduces critical ward count", async () => {
      // Severe baseline storm without interventions
      const resNoMitigation = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfallMultiplier: 1.8,
          durationHours: 6,
          drainageEfficiencyPct: -30,
          emergencyPumpsActive: false,
          sluiceGatesAutomated: false,
        }),
      });
      const dataNoMitigation = await resNoMitigation.json();

      // Same storm with full civil defence mitigation
      const resWithMitigation = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfallMultiplier: 1.8,
          durationHours: 6,
          drainageEfficiencyPct: +20,
          emergencyPumpsActive: true,
          sluiceGatesAutomated: true,
          temporaryBundsDeployed: true,
        }),
      });
      const dataWithMitigation = await resWithMitigation.json();

      assert.ok(
        dataWithMitigation.simulation.summary.scenarioAvgRisk <
          dataNoMitigation.simulation.summary.scenarioAvgRisk,
        "Interventions must reduce scenario average risk"
      );
      assert.ok(
        dataWithMitigation.simulation.summary.sparedPopulationEst > 0,
        "Spared population estimate must be positive under emergency mitigations"
      );
    });

    it("Calculates that tidal surge predominantly penalizes low-elevation wards (<5.0m)", async () => {
      // Test without tidal surge vs with +2.0m surge
      const resTide0 = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainfallMultiplier: 1.0, tidalSurgeMeters: 0.0 }),
      });
      const dataTide0 = await resTide0.json();

      const resTide2 = await fetch(`${BASE_URL}/api/v1/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainfallMultiplier: 1.0, tidalSurgeMeters: 2.0 }),
      });
      const dataTide2 = await resTide2.json();

      // Low elevation ward: Ward 131 (3.6m elevation)
      const w131_t0 = dataTide0.simulation.wardDeltas.find((w) => w.wardNumber === 131);
      const w131_t2 = dataTide2.simulation.wardDeltas.find((w) => w.wardNumber === 131);

      // Higher elevation ward: Ward 7 (7.8m elevation)
      const w7_t0 = dataTide0.simulation.wardDeltas.find((w) => w.wardNumber === 7);
      const w7_t2 = dataTide2.simulation.wardDeltas.find((w) => w.wardNumber === 7);

      const deltaLow = w131_t2.scenarioRisk - w131_t0.scenarioRisk;
      const deltaHigh = w7_t2.scenarioRisk - w7_t0.scenarioRisk;

      assert.ok(
        deltaLow > deltaHigh,
        `Tidal surge must impact low-elevation Ward 131 (+${deltaLow}) more than high-elevation Ward 7 (+${deltaHigh})`
      );
    });
  });

  // ==========================================
  // SUITE 3: PILOT REGION DATA INTEGRITY
  // ==========================================
  describe("3. Pilot Region GIS Data Invariants", () => {
    it("Verifies all wards have authentic geographic coordinates within Kolkata bounds", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/risk/map`);
      const geojson = await res.json();

      for (const f of geojson.features) {
        const [lng, lat] = f.geometry.coordinates;
        assert.ok(lat >= 22.45 && lat <= 22.65, `Lat ${lat} must be within KMC bounds`);
        assert.ok(lng >= 88.28 && lng <= 88.46, `Lng ${lng} must be within KMC bounds`);
        assert.ok(f.properties.populationDensity > 5000, "Must have realistic urban population density");
        assert.ok(f.properties.drainageCapacity > 10, "Drainage capacity must be > 10 mm/h");
      }
    });
  });
});
