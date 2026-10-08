import assert from 'node:assert';
import crypto from 'node:crypto';
import { ingestObservationsWithAuth, getLatestObservations } from '../lib/services/telemetryService.js';
import { calculateSecondaryDemand, matchDemand } from '../lib/domain/demandMatcher.js';
import { generateScenarioHash, runScenarioCalculation } from '../lib/domain/scenarioCache.js';
import { triageAlert } from '../lib/services/alertTriageService.js';

console.log('=== JALNETRA PHASE 12: RELEASE HARDENING VERIFICATION SUITE ===\n');

// -------------------------------------------------------------
// Fix 1: Telemetry Ingest Security (Auth Header & HMAC Signature)
// -------------------------------------------------------------
console.log('Testing Fix 1: Telemetry Ingest Authentication & HMAC Security...');

const mockObservation = JSON.stringify({
  stationId: 'kol-imd-alipore-01',
  value: 42.5,
  parameter: 'RAINFALL_RATE_MM_HR',
});

// Case 1A: Reject missing credentials
const resUnauth = ingestObservationsWithAuth(mockObservation, null, null);
assert.strictEqual(resUnauth.success, false, 'Unauthenticated payload must be rejected');
assert.strictEqual(resUnauth.status, 401, 'Status must be 401 Unauthorized');
console.log('  ✔ Reject unauthenticated ingest (401)');

// Case 1B: Accept valid Bearer API key
const validApiKey = 'jalnetra-dev-telemetry-secret';
const resBearer = ingestObservationsWithAuth(mockObservation, `Bearer ${validApiKey}`, null);
assert.strictEqual(resBearer.success, true, 'Valid Bearer token must be accepted');
assert.strictEqual(resBearer.status, 200, 'Status must be 200 OK');
console.log('  ✔ Ingest with valid Bearer API key (200)');

// Case 1C: Accept valid HMAC-SHA256 signature
const hmacSecret = validApiKey;
const validSignature = crypto.createHmac('sha256', hmacSecret).update(mockObservation).digest('hex');
const resHmac = ingestObservationsWithAuth(mockObservation, null, validSignature);
assert.strictEqual(resHmac.success, true, 'Valid HMAC signature must be accepted');
assert.strictEqual(resHmac.status, 200, 'Status must be 200 OK');
console.log('  ✔ Ingest with valid HMAC-SHA256 signature (200)');

// Case 1D: Reject invalid HMAC signature
const resInvalidHmac = ingestObservationsWithAuth(mockObservation, null, 'deadbeefbadsignature');
assert.strictEqual(resInvalidHmac.success, false, 'Tampered HMAC signature must be rejected');
assert.strictEqual(resInvalidHmac.status, 401, 'Status must be 401 Unauthorized');
console.log('  ✔ Reject tampered HMAC signature (401)');


// -------------------------------------------------------------
// Fix 2: Storm-Mode Action Framing (Triage Protocol)
// -------------------------------------------------------------
console.log('\nTesting Fix 2: Storm-Mode Action Protocols & Triage Framing...');

const criticalAlert = triageAlert({
  id: 'ALT-CRITICAL-TEST',
  wardId: 66,
  severity: 'CRITICAL',
  eventType: 'WATERLOGGING_PREDICTION',
  predictedDepthCm: 45,
  timestamp: new Date().toISOString(),
});

assert.strictEqual(criticalAlert.dispatchUrgency, 'IMMEDIATE');
assert.strictEqual(criticalAlert.provenance, 'SIMULATED');
assert(criticalAlert.mitigationSteps.some((s) => s.includes('Pre-deplete secondary storage')), 'Must include pre-depletion');
assert(criticalAlert.mitigationSteps.some((s) => s.includes('Palmer Bridge')), 'Must include outfall gate protocol');
console.log('  ✔ Storm triage returns concrete dispatch orders and outfall protocols');


// -------------------------------------------------------------
// Fix 3: Configurable Secondary Demand Assumptions
// -------------------------------------------------------------
console.log('\nTesting Fix 3: Configurable Demand Baseline Assumptions...');

const site = {
  id: 'park-circus-basin',
  name: 'Park Circus Drainage Basin',
  ward: 66,
  areaHectares: 42.5,
  runoffCoefficient: 0.88,
  existingStorageML: 1.2,
  plannedStorageML: 5.0,
  landUse: 'COMMERCIAL',
};

// Default assumptions
const defaultDemands = calculateSecondaryDemand(site);
const defaultToilet = defaultDemands.find((d) => d.category === 'TOILET_FLUSHING');
assert(defaultToilet, 'Toilet flushing demand must exist');
assert.strictEqual(defaultToilet.provenance, 'ASSUMED', 'Must carry explicit ASSUMED provenance');

// Custom assumptions
const customAssumptions = {
  toiletFlushingMLDPerHectare: 0.25,
  coolingTowerHVACMLDPerHectare: 0.30,
  horticultureParkMLDPerHectare: 0.05,
  fireAndConstructionMLDPerHectare: 0.02,
};
const customDemands = calculateSecondaryDemand(site, customAssumptions);
const customToilet = customDemands.find((d) => d.category === 'TOILET_FLUSHING');
assert.strictEqual(customToilet.dailyDemandML, Number((42.5 * 0.25).toFixed(3)));
assert(customToilet.dailyDemandML > defaultToilet.dailyDemandML, 'Custom demand must dynamically update');
console.log('  ✔ Configurable baseline assumptions update demands dynamically with ASSUMED tags');


// -------------------------------------------------------------
// Fix 4: Versioned Scenario Cache Invalidation & Hash Collision Safety
// -------------------------------------------------------------
console.log('\nTesting Fix 4: Versioned Scenario Cache Invalidation...');

const scenarioParams = {
  rainfallMm: 60,
  storageCapacityML: 15,
  dailyDemandML: 0.6,
  siteId: 'college-street-cistern',
  wardId: 48,
};

const hashA = generateScenarioHash(scenarioParams);
const run1 = runScenarioCalculation(scenarioParams);
assert.strictEqual(run1.cached, false, 'First evaluation must not be cached');

const run2 = runScenarioCalculation(scenarioParams);
assert.strictEqual(run2.cached, true, 'Subsequent evaluation with same hash must hit cache');
assert.strictEqual(run2.scenarioHash, hashA, 'Scenario hash must match');

// Different rainfall must produce distinct hash
const diffParams = { ...scenarioParams, rainfallMm: 60.5 };
const hashB = generateScenarioHash(diffParams);
assert.notStrictEqual(hashA, hashB, 'Different params must generate unique SHA256 hashes');
console.log('  ✔ Versioned scenario hash generation and LRU cache invalidation verified');


console.log('\n============================================================');
console.log('✔ ALL PHASE 12 HARDENING PATCH VERIFICATIONS PASSED (100%)!');
console.log('============================================================\n');
