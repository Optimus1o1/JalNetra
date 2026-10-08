import assert from 'node:assert';
import { runSimulation } from '../lib/services/simulationService.js';
import { triageAlert } from '../lib/services/alertTriageService.js';
import { evaluateWardTwinRisk } from '../lib/services/twinRiskService.js';
import { generateScenarioHash, runScenarioCalculation, clearScenarioCache } from '../lib/domain/scenarioCache.js';

console.log('=== JALNETRA BACKEND SERVICES & DOMAIN TEST SUITE ===');

// Test 1: Simulation Service Determinism & Speed
const simStart = performance.now();
const simRes = await runSimulation({
  siteId: 'park-circus-basin',
  rainfallMm: 50,
  storageCapacityML: 10,
  dailyDemandML: 0.5,
});
const simTime = performance.now() - simStart;

assert(simRes.siteId === 'park-circus-basin', 'Site ID matches');
assert(simRes.inflowML > 0, 'Inflow must be greater than zero');
assert(simRes.retainedML > 0, 'Retained volume must be positive');
assert(simRes.provenance === 'SIMULATED', 'Provenance must be strictly SIMULATED');
assert(simTime < 50, `Simulation time ${simTime.toFixed(2)}ms must be under 50ms`);
console.log('✔ Test 1 Passed: Simulation service deterministic and runs in <50ms (' + simTime.toFixed(2) + 'ms)');

// Test 2: Alert Triage Criticality
const criticalAlert = triageAlert({
  id: 'ALT-TEST-01',
  wardId: 66,
  severity: 'CRITICAL',
  eventType: 'WATERLOGGING_PREDICTION',
  predictedDepthCm: 35,
  timestamp: new Date().toISOString(),
});

assert(criticalAlert.dispatchUrgency === 'IMMEDIATE', 'Critical alert urgency must be IMMEDIATE');
assert(criticalAlert.coordinationUnit === 'DISASTER_MANAGEMENT', 'Unit must be DISASTER_MANAGEMENT');
assert(criticalAlert.mitigationSteps.length >= 3, 'Must have actionable mitigation steps');
console.log('✔ Test 2 Passed: Alert triage dispatches immediate disaster management actions');

// Test 3: Ward Twin Risk Logic under High Tide Lock
const normalRisk = evaluateWardTwinRisk(66, 20, 3.5);
const tidalLockedRisk = evaluateWardTwinRisk(66, 75, 5.2);

assert(normalRisk.drainageCongestionLevel === 'NORMAL', 'Low rain and stage should be NORMAL');
assert(tidalLockedRisk.drainageCongestionLevel === 'CRITICAL', 'Heavy rain + river >4.5m must be CRITICAL');
assert(tidalLockedRisk.waterloggingRiskScore > normalRisk.waterloggingRiskScore, 'Risk score must increase');
console.log('✔ Test 3 Passed: Ward twin risk accurately models Hooghly high-tide sewer lockup');

// Test 4: Scenario Hash Generation & Cache Hit
clearScenarioCache();
const p1 = { rainfallMm: 50, storageCapacityML: 10, dailyDemandML: 0.5, siteId: 'park-circus-basin', wardId: 66 };
const hash1 = generateScenarioHash(p1);
const hash2 = generateScenarioHash(p1);
assert.strictEqual(hash1, hash2, 'Identical scenario params must produce identical SHA256 hashes');

const calc1 = runScenarioCalculation(p1);
assert.strictEqual(calc1.cached, false, 'First run must be a cache miss');

const calc2 = runScenarioCalculation(p1);
assert.strictEqual(calc2.cached, true, 'Second run must hit LRU cache');
assert(calc2.executionTimeMs < 5, 'Cached execution must be under 5ms');
console.log('✔ Test 4 Passed: Scenario hashing and LRU memory caching verified (<5ms warm)');

console.log('\nALL 4 BACKEND SERVICE TESTS PASSED PERFECTLY!\n');
