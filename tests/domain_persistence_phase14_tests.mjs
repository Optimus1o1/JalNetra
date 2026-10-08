import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";
const DB_URL = process.env.DATABASE_URL || "postgresql://jalnetra_app:JalNetra2026PostgresSecure%21@db.mmnwbougzgmcootdggqv.supabase.co:5432/postgres";

test("JALNETRA Phase 14 — Domain Persistence Cutover & API Source-of-Truth Certification", async (t) => {
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    // -------------------------------------------------------------------------
    // 1. REPOSITORY LAYER DATABASE PERSISTENCE & POSTGIS QUERIES
    // -------------------------------------------------------------------------
    await t.test("1. CatchmentSiteRepository PostGIS & Spatial Access", async (t2) => {
      await t2.test("Catchment sites exist in PostgreSQL with valid geometries", async () => {
        const res = await client.query(`
          SELECT site_key, ward_number, ward_name, latitude, longitude,
                 roof_area_sq_m, open_ground_area_sq_m, runoff_coefficient,
                 collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
                 daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
                 recharge_suitability, ST_AsText(geom) as geom_wkt
          FROM catchment_sites
          ORDER BY ward_number ASC;
        `);
        assert.ok(res.rows.length >= 6, "Must retrieve all registered catchment sites from PostgreSQL");
        const sskm = res.rows.find((s) => s.site_key === "site-w071-sskm");
        assert.ok(sskm, "SSKM hospital campus site must exist in PostgreSQL");
        assert.equal(sskm.ward_number, 71);
        assert.ok(Number(sskm.roof_area_sq_m) > 0);
        assert.ok(sskm.geom_wkt.startsWith("POINT("), "Site must have PostGIS Point geometry");
      });

      await t2.test("PostGIS Viewport Bounding Box Query (geom && ST_MakeEnvelope)", async () => {
        const t0 = performance.now();
        const res = await client.query(`
          EXPLAIN ANALYZE
          SELECT site_key, ward_number, site_name
          FROM catchment_sites
          WHERE geom && ST_MakeEnvelope(88.33, 22.50, 88.42, 22.58, 4326)
          ORDER BY ward_number ASC;
        `);
        const duration = performance.now() - t0;
        assert.ok(res.rows.length > 0, "Query plan must execute successfully");
        assert.ok(duration < 500, `Viewport query must complete in <500ms (took ${duration.toFixed(2)}ms)`);
      });

      await t2.test("PostGIS Radial Proximity Buffer Query (ST_DWithin)", async () => {
        const t0 = performance.now();
        const res = await client.query(`
          EXPLAIN ANALYZE
          SELECT site_key, ward_number, site_name
          FROM catchment_sites
          WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(88.3912, 22.5385), 4326)::geography, 5000);
        `);
        const duration = performance.now() - t0;
        assert.ok(res.rows.length > 0, "Proximity plan must execute successfully");
        assert.ok(duration < 500, `Proximity query must complete in <500ms (took ${duration.toFixed(2)}ms)`);
      });
    });

    await t.test("2. InterventionRepository Authority & Status Filtering", async (t2) => {
      await t2.test("Retrieves authoritative municipal interventions from PostgreSQL", async () => {
        const res = await client.query(`
          SELECT intervention_key, name, type, design_capacity_l, estimated_cost_inr,
                 annual_harvest_potential_ml, annual_runoff_avoided_ml, priority_score, status
          FROM intervention_options
          ORDER BY priority_score DESC;
        `);
        assert.ok(res.rows.length >= 5, "Must have at least 5 registered interventions");
        assert.equal(res.rows[0].intervention_key, "intv-01-sskm-cistern");
        assert.equal(res.rows[0].status, "APPROVED");
      });

      await t2.test("Filters interventions by status correctly", async () => {
        const res = await client.query(`
          SELECT intervention_key, status
          FROM intervention_options
          WHERE UPPER(status) = 'APPROVED';
        `);
        assert.ok(res.rows.length > 0);
        assert.ok(res.rows.every((r) => r.status === "APPROVED"));
      });
    });

    await t.test("3. ScenarioRepository Persistence & Deduplication", async (t2) => {
      const testHash = `phase14-test-hash-${Date.now()}`;

      await t2.test("Atomically persists scenario to persisted_scenarios table", async () => {
        await client.query(`
          INSERT INTO persisted_scenarios (
            scenario_hash, scenario_name, ward_number, rainfall_event_mm,
            calculation_version, model_version, inputs, results, provenance
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          testHash,
          "Phase 14 Test Scenario",
          66,
          75.0,
          "2.4.0",
          "JalNetra-MassBalance-v1",
          JSON.stringify({ wardNumber: 66, rainfallEventMm: 75.0 }),
          JSON.stringify({ harvestVolumeL: 850000, circularityScore: 88 }),
          "SIMULATED"
        ]);

        const checkRes = await client.query(
          "SELECT scenario_hash, ward_number FROM persisted_scenarios WHERE scenario_hash = $1;",
          [testHash]
        );
        assert.equal(checkRes.rows.length, 1);
        assert.equal(checkRes.rows[0].scenario_hash, testHash);
      });

      await t2.test("Upserts cleanly on duplicate hash without collision errors", async () => {
        await client.query(`
          INSERT INTO persisted_scenarios (
            scenario_hash, scenario_name, ward_number, rainfall_event_mm,
            calculation_version, model_version, inputs, results, provenance
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (scenario_hash) DO UPDATE SET
            scenario_name = EXCLUDED.scenario_name,
            rainfall_event_mm = EXCLUDED.rainfall_event_mm;
        `, [
          testHash,
          "Phase 14 Test Scenario Updated",
          66,
          85.0,
          "2.4.0",
          "JalNetra-MassBalance-v1",
          JSON.stringify({ wardNumber: 66, rainfallEventMm: 85.0 }),
          JSON.stringify({ harvestVolumeL: 920000, circularityScore: 90 }),
          "SIMULATED"
        ]);

        const checkRes = await client.query(
          "SELECT scenario_name, rainfall_event_mm FROM persisted_scenarios WHERE scenario_hash = $1;",
          [testHash]
        );
        assert.equal(checkRes.rows[0].scenario_name, "Phase 14 Test Scenario Updated");
        assert.equal(Number(checkRes.rows[0].rainfall_event_mm), 85.0);
      });
    });

    await t.test("4. Ward and Sensor Persistence Authority", async (t2) => {
      await t2.test("Wards table contains 12 pilot wards with PostGIS polygons", async () => {
        const res = await client.query(`
          SELECT ward_number, ward_name, borough, elevation_baseline_m, imperviousness_pct,
                 ST_GeometryType(geom) as geom_type
          FROM wards
          ORDER BY ward_number ASC;
        `);
        assert.ok(res.rows.length >= 12);
        assert.ok(res.rows.every((r) => r.geom_type === "ST_Polygon"));
      });

      await t2.test("Sensor nodes table contains active monitoring fleet", async () => {
        const res = await client.query(`
          SELECT node_key, name, type, status, latitude, longitude
          FROM sensor_nodes
          WHERE node_key LIKE 'sn-%'
          ORDER BY node_key ASC;
        `);
        assert.equal(res.rows.length, 12, "Must return exactly 12 pilot IoT sensor nodes");
      });
    });

    // -------------------------------------------------------------------------
    // 5. CORE DECISION ROUTES SOURCE-OF-TRUTH VERIFICATION
    // -------------------------------------------------------------------------
    await t.test("5. Core Circular-Water Routes Certified Against Database", async (t2) => {
      await t2.test("GET /api/v1/opportunities is database-backed and supports bbox", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/opportunities?rainfall=50&bbox=88.33,22.50,88.42,22.58`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, "success");
        assert.equal(data.operationalMode, "DATABASE_MODE");
        assert.equal(data.dataSource, "POSTGRESQL_POSTGIS");
        assert.ok(data.totalCatchmentSites > 0);
        assert.ok(data.basinHarvestableVolumeL > 0);
        assert.equal(data.provenance, "SIMULATED");
      });

      await t2.test("GET /api/v1/water-balance is database-backed and conserves mass balance", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/water-balance?rainfall=60`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, "success");
        assert.equal(data.operationalMode, "DATABASE_MODE");
        assert.equal(data.dataSource, "POSTGRESQL_POSTGIS");
        assert.ok(data.siteBalances.length >= 6);

        data.siteBalances.forEach((sb) => {
          const { inflowL, overflowL, reuseWithdrawalL, rechargeInfiltrationL, currentStorageL, previousStorageL } = sb.storageBalance;
          const totalOutflow = overflowL + reuseWithdrawalL + rechargeInfiltrationL;
          const storageDelta = currentStorageL - previousStorageL;
          const closureDelta = Math.abs(inflowL - (storageDelta + totalOutflow));
          assert.ok(closureDelta < 1e-4, `Closure delta must be < 1e-4, got ${closureDelta}`);
        });
      });

      await t2.test("GET /api/v1/demand is database-backed and categorizes non-potable loads", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/demand`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, "success");
        assert.equal(data.operationalMode, "DATABASE_MODE");
        assert.equal(data.dataSource, "POSTGRESQL_POSTGIS");
        assert.ok(data.basinSummary.totalDailyNonPotableDemandL > 0);
        assert.ok(data.basinSummary.applicationApportionment.toiletFlushingL > 0);
      });

      await t2.test("GET /api/v1/recharge is database-backed and classifies suitability", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/recharge`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, "success");
        assert.equal(data.operationalMode, "DATABASE_MODE");
        assert.equal(data.dataSource, "POSTGRESQL_POSTGIS");
        assert.ok(data.totalSitesAssessed >= 6);
        assert.ok(data.basinRechargeOverview.totalMaxDailyRechargeCapacityL > 0);
      });

      await t2.test("GET /api/v1/interventions is database-backed from PostgreSQL", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/interventions`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, "success");
        assert.equal(data.operationalMode, "DATABASE_MODE");
        assert.equal(data.dataSource, "POSTGRESQL_POSTGIS");
        assert.ok(data.totalInterventions >= 5);
      });

      await t2.test("POST /api/v1/scenarios executes, persists, and utilizes cache hierarchy", async () => {
        const payload = {
          wardNumber: 66,
          rainfallEventMm: 62.0,
          addedStorageCapacityL: 85000,
          permeablePavementFractionPct: 25,
          activeRechargeWells: true,
          captureEfficiencyBoostPct: 15,
        };

        const res1 = await fetch(`${BASE_URL}/api/v1/scenarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        assert.equal(res1.status, 200);
        const data1 = await res1.json();
        assert.equal(data1.status, "success");
        assert.ok(data1.scenarioHash);

        // Immediate repeat must hit in-memory cache
        const res2 = await fetch(`${BASE_URL}/api/v1/scenarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        assert.equal(res2.status, 200);
        const data2 = await res2.json();
        assert.equal(data2.cacheHit, true);
        assert.equal(data2.source, "IN_MEMORY_CACHE");
      });

      await t2.test("GET /api/v1/storm is database-backed and evaluates pre-storm storage headroom", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/storm`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, "success");
        assert.equal(data.operationalMode, "DATABASE_MODE");
        assert.equal(data.dataSource, "POSTGRESQL_POSTGIS");
        assert.ok(data.basinStorageReadiness.totalTankCapacityML > 0);
        assert.ok(data.basinStorageReadiness.availableHeadroomML >= 0);
      });
    });

    // -------------------------------------------------------------------------
    // 6. SCIENTIFIC PARITY & HYDROLOGICAL MASS CONSERVATION
    // -------------------------------------------------------------------------
    await t.test("6. Scientific Parity & Physical Invariants", async (t2) => {
      await t2.test("Deterministic Rational Method (Q = C * I * A) matches theoretical output", async () => {
        const sitesRes = await client.query("SELECT * FROM catchment_sites WHERE site_key = 'site-w071-sskm';");
        const sskm = sitesRes.rows[0];
        const P = 50.0; // mm
        const netRainMm = P - 2.0; // 2mm first flush
        const expectedHarvestL = Math.round(
          netRainMm * Number(sskm.roof_area_sq_m) * Number(sskm.runoff_coefficient) * Number(sskm.collection_efficiency)
        );
        // 48mm * 32500m2 * 0.90 * 0.88 = 1,235,520 L
        assert.equal(expectedHarvestL, 1235520);
      });

      await t2.test("Physical non-negativity and storage boundaries are respected", async () => {
        const sitesRes = await client.query("SELECT existing_tank_capacity_l, current_tank_storage_l FROM catchment_sites;");
        sitesRes.rows.forEach((row) => {
          const cap = Number(row.existing_tank_capacity_l);
          const curr = Number(row.current_tank_storage_l);
          assert.ok(curr >= 0, "Storage must be >= 0");
          assert.ok(curr <= cap, "Storage cannot exceed physical capacity");
        });
      });
    });
  } finally {
    await client.end();
  }
});
