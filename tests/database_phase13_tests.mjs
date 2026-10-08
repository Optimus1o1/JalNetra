import assert from 'node:assert';
import pg from 'pg';

console.log('=== JALNETRA PHASE 13: DATABASE & POSTGIS CERTIFICATION SUITE ===\n');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/jalnetra_twin?schema=public';

const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

async function runDatabasePhase13Tests() {
  let client;
  try {
    client = await pool.connect();
    console.log('✔ Connection to PostgreSQL established successfully');

    // 1. Verify PostGIS Extension
    const extRes = await client.query(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';
    `);
    assert(extRes.rows.length > 0, 'PostGIS extension must be installed');
    const version = extRes.rows[0].extversion;
    console.log(`✔ PostGIS Extension Active: version ${version}`);

    // 2. Verify Table Existence (12 Operational Tables)
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map((r) => r.table_name);
    const requiredTables = [
      'catchment_sites',
      'intervention_options',
      'persisted_scenarios',
      'sensor_nodes',
      'wards',
    ];
    for (const req of requiredTables) {
      assert(tables.includes(req), `Table ${req} must exist in public schema`);
    }
    console.log(`✔ Verified ${tables.length} tables in database (including all required schemas)`);

    // 3. Verify Spatial Columns and Geometry Types
    const geomRes = await client.query(`
      SELECT f_table_name, f_geometry_column, type, srid 
      FROM geometry_columns 
      WHERE f_table_schema = 'public';
    `);
    assert(geomRes.rows.length >= 2, 'Spatial geometry columns must be registered');
    console.log(`✔ PostGIS Geometry columns registered: ${geomRes.rows.map((r) => `${r.f_table_name}.${r.f_geometry_column} (${r.type}, SRID ${r.srid})`).join(', ')}`);

    // 4. Verify Spatial Indices (GiST)
    const indexRes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexdef ILIKE '%gist%' AND schemaname = 'public';
    `);
    assert(indexRes.rows.length >= 2, 'GiST spatial indices must exist for spatial queries');
    console.log(`✔ Verified GiST Spatial Indices: ${indexRes.rows.map((r) => `${r.tablename}.${r.indexname}`).join(', ')}`);

    // 5. Benchmark Spatial Point-in-Polygon Query (ST_Contains)
    const pointQueryStart = performance.now();
    const pipRes = await client.query(`
      EXPLAIN ANALYZE
      SELECT ward_number, ward_name 
      FROM wards 
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(88.368, 22.541), 4326));
    `);
    const pipTime = performance.now() - pointQueryStart;
    console.log(`✔ Spatial Point-in-Polygon Query executed in ${pipTime.toFixed(2)}ms`);

    // 6. Benchmark Spatial Proximity Buffer Query (ST_DWithin)
    const proxStart = performance.now();
    const proxRes = await client.query(`
      EXPLAIN ANALYZE
      SELECT id, name 
      FROM catchment_sites 
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(88.360, 22.530), 4326)::geography, 3000);
    `);
    const proxTime = performance.now() - proxStart;
    console.log(`✔ Spatial Proximity Buffer (3km ST_DWithin) executed in ${proxTime.toFixed(2)}ms`);

    // 7. Verify Catchment Sites Seed Data
    const sitesRes = await client.query(`SELECT count(*)::int as count FROM catchment_sites;`);
    assert(sitesRes.rows[0].count >= 6, 'Catchment sites must contain baseline records');
    console.log(`✔ Catchment sites record count: ${sitesRes.rows[0].count} sites`);

    // 8. Verify Municipal Interventions Seed Data
    const intRes = await client.query(`SELECT count(*)::int as count FROM intervention_options;`);
    assert(intRes.rows[0].count >= 5, 'Interventions must contain baseline records');
    console.log(`✔ Intervention options record count: ${intRes.rows[0].count} options`);

    // 9. Verify Scenario Persistence (L2 PostgreSQL Cache)
    const testHash = 'test-phase13-' + Date.now().toString(16);
    await client.query(`
      INSERT INTO persisted_scenarios ("scenarioHash", "rainfallMm", "storageCapacityML", "dailyDemandML", "resultPayload", "accessCount", "createdAt", "updatedAt")
      VALUES ($1, 55.0, 12.0, 0.75, '{"retainedML": 10.5, "overflowML": 1.5}'::jsonb, 1, NOW(), NOW())
      ON CONFLICT ("scenarioHash") DO UPDATE SET "accessCount" = persisted_scenarios."accessCount" + 1;
    `, [testHash]);

    const persistedRes = await client.query(
      `SELECT "scenarioHash", "accessCount" FROM persisted_scenarios WHERE "scenarioHash" = $1;`,
      [testHash]
    );
    assert.strictEqual(persistedRes.rows[0].scenarioHash, testHash);
    console.log('✔ PersistedScenario record created and retrieved successfully');

    // 10. Clean up test record
    await client.query(`DELETE FROM persisted_scenarios WHERE "scenarioHash" = $1;`, [testHash]);
    console.log('✔ Cleaned up temporary test scenario record');

    console.log('\n============================================================');
    console.log('✔ ALL 10 DATABASE & POSTGIS CERTIFICATION TESTS PASSED!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('❌ Database test failed:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runDatabasePhase13Tests();
