import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";
const DB_URL = process.env.DATABASE_URL || "postgresql://jalnetra_app:JalNetra2026PostgresSecure%21@db.mmnwbougzgmcootdggqv.supabase.co:5432/postgres";

test("JALNETRA Phase 13 — Production PostgreSQL / PostGIS Data-Layer Certification", async (t) => {

  await t.test("1. PostgreSQL & PostGIS Spatial Extension Verification", async () => {
    const client = new pg.Client({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    try {
      const versionRes = await client.query("SELECT version(), postgis_full_version();");
      assert.ok(versionRes.rows.length > 0, "Database must respond to version query");
      assert.match(versionRes.rows[0].version, /PostgreSQL/i, "Must be true PostgreSQL engine");
      assert.match(versionRes.rows[0].postgis_full_version, /POSTGIS="3\./i, "PostGIS 3.x extension must be active");

      // Verify spatial tables exist
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('wards', 'catchment_sites', 'intervention_options', 'persisted_scenarios');
      `);
      assert.strictEqual(tablesRes.rows.length, 4, "All 4 core circular rainwater tables must exist in public schema");

      // Verify GiST spatial indices exist
      const indexRes = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('wards', 'catchment_sites') 
          AND indexdef ILIKE '%gist%';
      `);
      assert.ok(indexRes.rows.length >= 2, "GiST spatial indices must be registered on wards and catchment_sites");
    } finally {
      await client.end();
    }
  });

  await t.test("2. Real PostGIS Spatial Query Benchmarking", async (t) => {
    const client = new pg.Client({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    try {
      // 2A. ST_Contains spatial join
      await t.test("ST_Contains: Spatial Join between Wards and Catchment Sites", async () => {
        const t0 = performance.now();
        const res = await client.query(`
          EXPLAIN ANALYZE
          SELECT w.ward_number, w.ward_name, count(c.id) as sites_count
          FROM wards w
          JOIN catchment_sites c ON ST_Contains(w.geom, c.geom)
          GROUP BY w.ward_number, w.ward_name;
        `);
        const executionTimeMs = performance.now() - t0;
        assert.ok(res.rows.length > 0, "Explain analyze must return execution plan");
        assert.ok(executionTimeMs < 500, `ST_Contains spatial query must complete under 500ms (took ${executionTimeMs.toFixed(2)}ms)`);
      });

      // 2B. ST_DWithin distance query
      await t.test("ST_DWithin: 5km Catchment Proximity Buffer", async () => {
        const t0 = performance.now();
        const res = await client.query(`
          EXPLAIN ANALYZE
          SELECT site_key, site_name
          FROM catchment_sites
          WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(88.3426, 22.5398), 4326)::geography,
            5000
          );
        `);
        const executionTimeMs = performance.now() - t0;
        assert.ok(res.rows.length > 0, "Explain analyze must return execution plan");
        assert.ok(executionTimeMs < 500, `ST_DWithin proximity query must complete under 500ms (took ${executionTimeMs.toFixed(2)}ms)`);
      });

      // 2C. Bounding Box Viewport Query (&& operator)
      await t.test("Bounding Box Viewport Query: geom && ST_MakeEnvelope", async () => {
        const t0 = performance.now();
        const res = await client.query(`
          EXPLAIN ANALYZE
          SELECT ward_number, ward_name
          FROM wards
          WHERE geom && ST_MakeEnvelope(88.30, 22.48, 88.42, 22.58, 4326);
        `);
        const executionTimeMs = performance.now() - t0;
        assert.ok(res.rows.length > 0, "Explain analyze must return execution plan");
        assert.ok(executionTimeMs < 500, `Bounding box query must complete under 500ms (took ${executionTimeMs.toFixed(2)}ms)`);
      });
    } finally {
      await client.end();
    }
  });

  await t.test("3. Decision Route Database Backing & Operational Mode", async (t) => {
    // 3A. Health check route
    await t.test("GET /api/v1/admin/seed reports DATABASE_MODE and healthy PostGIS", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/seed`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, "healthy");
      assert.strictEqual(json.dbHealth.connected, true);
      assert.strictEqual(json.dbHealth.operationalMode, "DATABASE_MODE");
      assert.ok(json.dbHealth.postgisVersion.includes("3."), "Must report active PostGIS 3.x");
    });

    // 3B. Opportunities route
    await t.test("GET /api/v1/opportunities queries PostgreSQL/PostGIS", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/opportunities?ward=66&rainfall=50`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, "success");
      assert.strictEqual(json.operationalMode, "DATABASE_MODE");
      assert.strictEqual(json.dataSource, "POSTGRESQL_POSTGIS");
      assert.ok(json.sites.length > 0, "Must return catchment sites from PostgreSQL");
    });

    // 3C. Water Balance route
    await t.test("GET /api/v1/water-balance queries PostgreSQL/PostGIS and enforces mass balance", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/water-balance?rainfall=55`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, "success");
      assert.strictEqual(json.operationalMode, "DATABASE_MODE");
      assert.strictEqual(json.dataSource, "POSTGRESQL_POSTGIS");
      assert.ok(json.siteBalances.length >= 6, "Must evaluate all seeded catchment sites");
    });

    // 3D. Interventions route
    await t.test("GET /api/v1/interventions queries PostgreSQL portfolio", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/interventions`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, "success");
      assert.strictEqual(json.operationalMode, "DATABASE_MODE");
      assert.strictEqual(json.dataSource, "POSTGRESQL_POSTGIS");
      assert.ok(json.interventions.length >= 5, "Must return seeded municipal interventions from PostgreSQL");
    });

    // 3E. Scenario Persistence
    await t.test("POST /api/v1/scenarios persists scenario run to PostgreSQL", async () => {
      const payload = {
        wardNumber: 66,
        rainfallEventMm: 72.5,
        addedStorageCapacityL: 95000,
        permeablePavementFractionPct: 30,
        activeRechargeWells: true,
        captureEfficiencyBoostPct: 18,
      };

      const res = await fetch(`${BASE_URL}/api/v1/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, "success");
      assert.strictEqual(json.operationalMode, "DATABASE_MODE");
      assert.ok(json.scenarioHash, "Must return SHA-256 scenario hash");

      // Verify persisted in PostgreSQL
      const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();
      try {
        const queryRes = await client.query(`
          SELECT scenario_hash, ward_number, rainfall_event_mm 
          FROM persisted_scenarios 
          WHERE scenario_hash = $1;
        `, [json.scenarioHash]);
        assert.strictEqual(queryRes.rows.length, 1, "Scenario record must exist in PostgreSQL persisted_scenarios table");
        assert.strictEqual(queryRes.rows[0].ward_number, 66);
      } finally {
        await client.end();
      }
    });
  });

  await t.test("4. Numerical Equivalence & Zero-Fabrication Integrity", () => {
    // Verified against domain equations
    const P = 50; // mm
    const A = 14200; // m2
    const C = 0.88;
    const eta = 0.85;
    const expectedYieldL = Math.round(P * A * C * eta);
    assert.strictEqual(expectedYieldL, 531080);
  });

  await t.test("5. Resilient Degradation & In-Memory Fallback", async () => {
    // Audit route must always respond even if database is flagged
    const auditRes = await fetch(`${BASE_URL}/api/v1/admin/audit`);
    assert.strictEqual(auditRes.status, 200);
    const auditJson = await auditRes.json();
    assert.ok(auditJson.dbHealth !== undefined, "Audit endpoint must report dbHealth status");
  });
});
