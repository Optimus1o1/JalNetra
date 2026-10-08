import assert from 'node:assert';
import { rainwaterSites } from '../lib/data/rainwaterSitesData.js';
import { calculateOpportunity } from '../lib/domain/rainwaterEngine.js';
import { calculateStorageBalance } from '../lib/domain/storageBalance.js';
import { calculateSecondaryDemand, matchDemand } from '../lib/domain/demandMatcher.js';
import { evaluateRechargeSuitability } from '../lib/domain/rechargeSuitability.js';
import { calculateInterventions } from '../lib/domain/interventionPlanner.js';
import { calculateCircularityScore } from '../lib/domain/waterCircularityScore.js';

console.log('=== JALNETRA END-TO-END TWIN JOURNEY TEST SUITE ===\n');

// THE CORE USER JOURNEY:
// RAIN -> OBSERVE -> PREDICT -> CAPTURE OPPORTUNITY -> STORAGE -> REUSE / RECHARGE -> RUNOFF REDUCTION -> IMPACT

// Step 1: RAIN & CATCHMENT SELECTION
const focalCatchment = rainwaterSites.find((s) => s.id === 'park-circus-basin');
assert(focalCatchment, 'Focal catchment Park Circus must exist');
const simulatedStormRainfallMm = 65; // Intense monsoon cloudburst
console.log(`Step 1 [RAIN]: Catchment ${focalCatchment.name} (Ward ${focalCatchment.ward}), Storm Event: ${simulatedStormRainfallMm} mm`);

// Step 2: OBSERVE & CAPTURE OPPORTUNITY (Rational Method)
const opp = calculateOpportunity(focalCatchment, simulatedStormRainfallMm);
assert(opp.harvestablePotentialML > 0, 'Harvestable potential must be > 0');
assert(opp.captureEfficiencyPct > 0 && opp.captureEfficiencyPct <= 100, 'Efficiency between 0-100');
console.log(`Step 2 [OPPORTUNITY]: Total Rain: ${opp.totalPrecipitationML} ML | Harvestable: ${opp.harvestablePotentialML} ML (Efficiency: ${opp.captureEfficiencyPct}%)`);

// Step 3: STORAGE SIZING & MASS BALANCE
const plannedTankCapacityML = 12.0; // Proposed municipal cistern
const dailySecondaryDemandML = 0.8; // Toilet flushing + commercial cooling in basin
const balance = calculateStorageBalance(
  opp.harvestablePotentialML,
  plannedTankCapacityML,
  dailySecondaryDemandML,
  focalCatchment.existingStorageML
);
assert.strictEqual(balance.massBalanceErrorML, 0, 'Hydrologic mass balance must close identically to 0');
assert(balance.finalStorageML <= plannedTankCapacityML, 'Storage cannot exceed capacity');
console.log(`Step 3 [STORAGE]: Retained: ${balance.retainedML} ML | Overflow: ${balance.overflowML} ML | Mass Balance Delta: ${balance.massBalanceErrorML} ML`);

// Step 4: REUSE DEMAND MATCHING
const demandCats = calculateSecondaryDemand(focalCatchment);
const demandMatch = matchDemand(balance.retainedML, demandCats);
assert(demandMatch.totalAllocatedML <= balance.retainedML, 'Cannot allocate more water than retained');
assert(demandMatch.overallSatisfactionRate >= 0 && demandMatch.overallSatisfactionRate <= 100);
console.log(`Step 4 [REUSE]: Non-Potable Demand: ${demandMatch.totalDemandML} ML/d | Allocated: ${demandMatch.totalAllocatedML} ML | Satisfaction: ${demandMatch.overallSatisfactionRate}%`);

// Step 5: GROUNDWATER RECHARGE SUITABILITY
const aquiferProps = {
  permeabilityK: 12.5,
  depthToWaterTableM: 7.2,
  soilInfiltrationRateMmHr: 22,
  salinityPPM: 320,
};
const recharge = evaluateRechargeSuitability(aquiferProps);
assert(recharge.suitabilityScore >= 0 && recharge.suitabilityScore <= 100);
assert(['HIGHLY_SUITABLE', 'MODERATE', 'MARGINAL', 'UNSUITABLE'].includes(recharge.rating));
console.log(`Step 5 [RECHARGE]: Aquifer Suitability: ${recharge.suitabilityScore}/100 (${recharge.rating}) | Method: ${recharge.recommendedMethod}`);

// Step 6: RUNOFF REDUCTION & MUNICIPAL IMPACT INTERVENTIONS
const availableBudgetCr = 25.0; // 25 Crore INR municipal budget
const plan = calculateInterventions(undefined, availableBudgetCr);
assert(plan.allocatedBudgetCr <= availableBudgetCr, 'Intervention allocation must respect budget constraint');
assert(plan.selectedInterventions.length > 0, 'Plan must select at least one intervention');
console.log(`Step 6 [INTERVENTIONS]: Allocated ${plan.allocatedBudgetCr} Cr out of ${availableBudgetCr} Cr | Interventions: ${plan.selectedInterventions.length} sites | Runoff Relief: ${plan.averageDrainageReliefPct}%`);

// Step 7: OVERALL CIRCULARITY SCORE
const circularity = calculateCircularityScore(
  opp.harvestablePotentialML,
  opp.totalPrecipitationML,
  demandMatch.overallSatisfactionRate,
  recharge.suitabilityScore,
  opp.avoidedRunoffPct
);
assert(circularity.score >= 0 && circularity.score <= 100);
console.log(`Step 7 [CIRCULAR DIGITAL TWIN IMPACT]: Circularity Index: ${circularity.score}/100 [Rating: ${circularity.status}]`);

console.log('\n============================================================');
console.log('✔ ENTIRE 7-STEP CIRCULAR TWIN JOURNEY PASSED ALL INVARIANTS!');
console.log('============================================================\n');
