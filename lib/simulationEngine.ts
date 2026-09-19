import { PILOT_GRID_CELLS } from "./data/pilotRegionData";
import { SimulationScenarioRequest, SimulationScenarioResult } from "./types";

export function runSimulationScenario(
  inputs: SimulationScenarioRequest
): SimulationScenarioResult {
  const {
    rainfallMultiplier,
    durationHours,
    drainageEfficiencyPct,
    tidalSurgeMeters,
    emergencyPumpsActive,
    sluiceGatesAutomated,
    permeablePavementScenario,
    temporaryBundsDeployed,
  } = inputs;

  let totalBaselineRisk = 0;
  let totalScenarioRisk = 0;
  let criticalWards = 0;
  let totalInundatedAreaSqKm = 0;
  let sparedPopulation = 0;

  const wardDeltas = PILOT_GRID_CELLS.map((cell) => {
    // Baseline hazard factors
    const baseRainfall = cell.forecastRainfall24h;
    const adjustedRainfall = baseRainfall * rainfallMultiplier;

    // Effective drainage capacity: modified by efficiency % and emergency interventions
    let effectiveDrainage = cell.drainageCapacity * (1 + drainageEfficiencyPct / 100);
    if (emergencyPumpsActive) {
      effectiveDrainage += 12; // Adds 12 mm/h pumping extraction
    }
    if (sluiceGatesAutomated) {
      effectiveDrainage += 6; // Prevents 6 mm/h tidal lock loss
    }
    if (inputs.targetWardNumber && cell.wardNumber === inputs.targetWardNumber) {
      effectiveDrainage += 12; // Extra targeted emergency pumping capacity for focused ward
    }

    // Imperviousness modification
    let effectiveImperviousness = cell.imperviousness;
    if (permeablePavementScenario) {
      effectiveImperviousness = Math.max(30, cell.imperviousness - 25);
    }

    // Tidal surge effect on low elevation wards (< 5.0m MSL)
    const elevationVulnerability = Math.max(0, 7.5 - cell.elevation) / 7.5;
    const tidalPenetrationFactor =
      cell.elevation < 5.0 ? (tidalSurgeMeters / 2.5) * 0.35 : 0;

    // Recalculate runoff accumulation
    const runoffCoefficient = (effectiveImperviousness / 100) * 0.9 + 0.1;
    const rainExcessMm = Math.max(
      0,
      adjustedRainfall * (durationHours / 24) * runoffCoefficient -
        effectiveDrainage * (durationHours / 24)
    );

    // Hazard calculation
    const soilFactor = cell.soilSaturationPct / 100;
    const newHazardScore = Math.min(
      1.0,
      (rainExcessMm / 70) * 0.6 +
        soilFactor * 0.2 +
        elevationVulnerability * 0.15 +
        tidalPenetrationFactor
    );

    // Temporary bunds protection reduces localized exposure for critical infrastructure
    let effectiveExposure = cell.exposureScore;
    if (temporaryBundsDeployed) {
      effectiveExposure = Math.max(0.2, cell.exposureScore * 0.82);
    }

    // Composite risk = Hazard * Exposure * Vulnerability
    const newScenarioRisk = Number(
      Math.min(1.0, Math.max(0.05, newHazardScore * effectiveExposure * cell.vulnerabilityScore * 1.35)).toFixed(2)
    );

    const delta = Number((newScenarioRisk - cell.riskScore).toFixed(2));
    const newInundationDepthCm = Math.max(
      0,
      Math.round(rainExcessMm * 0.65 + (tidalSurgeMeters > 0 && cell.elevation < 4.5 ? tidalSurgeMeters * 18 : 0))
    );

    totalBaselineRisk += cell.riskScore;
    totalScenarioRisk += newScenarioRisk;

    if (newScenarioRisk >= 0.75) {
      criticalWards++;
    }

    if (newInundationDepthCm >= 15) {
      totalInundatedAreaSqKm += 1.8; // Average ward footprint
    }

    // Counterfactual unmitigated risk (without emergency interventions)
    const unmitigatedDrainage = cell.drainageCapacity * (1 + drainageEfficiencyPct / 100);
    const unmitigatedRainExcessMm = Math.max(
      0,
      adjustedRainfall * (durationHours / 24) * runoffCoefficient -
        unmitigatedDrainage * (durationHours / 24)
    );
    const unmitigatedHazardScore = Math.min(
      1.0,
      (unmitigatedRainExcessMm / 70) * 0.6 +
        soilFactor * 0.2 +
        elevationVulnerability * 0.15 +
        tidalPenetrationFactor
    );
    const unmitigatedRisk = Number(
      Math.min(1.0, Math.max(0.05, unmitigatedHazardScore * cell.exposureScore * cell.vulnerabilityScore * 1.35)).toFixed(2)
    );

    const interventionBenefit = unmitigatedRisk - newScenarioRisk;
    if (interventionBenefit > 0.01 || delta < -0.05) {
      sparedPopulation += Math.round(cell.populationDensity * Math.max(interventionBenefit, 0.05) * 1.25);
    }

    let status: "mitigated" | "escalated" | "unchanged" = "unchanged";
    if (delta < -0.04 || interventionBenefit > 0.05) status = "mitigated";
    else if (delta > 0.04) status = "escalated";

    return {
      cellId: cell.id,
      wardNumber: cell.wardNumber,
      wardName: cell.wardName,
      baselineRisk: cell.riskScore,
      scenarioRisk: newScenarioRisk,
      delta,
      inundationDepthCm: newInundationDepthCm,
      status,
    };
  });

  const count = PILOT_GRID_CELLS.length;
  const baselineAvgRisk = Number((totalBaselineRisk / count).toFixed(2));
  const scenarioAvgRisk = Number((totalScenarioRisk / count).toFixed(2));
  const riskDeltaPct = Number((((scenarioAvgRisk - baselineAvgRisk) / (baselineAvgRisk || 1)) * 100).toFixed(1));

  // Economic risk mitigation estimation (in Indian Crore INR)
  const mitigatedEconomicRiskCr = Number(
    Math.max(
      sparedPopulation > 0 ? 1.5 : 0,
      (sparedPopulation / 10000) * 1.85 + Math.max(0, baselineAvgRisk - scenarioAvgRisk) * 45
    ).toFixed(1)
  );

  const scenarioName = emergencyPumpsActive
    ? "Active Pumping & Sluice Relief"
    : rainfallMultiplier > 1.2
    ? `Intense Rainfront (+${Math.round((rainfallMultiplier - 1) * 100)}%)`
    : "Hydraulic Stress Scenario";

  const updatedCells = PILOT_GRID_CELLS.map((cell) => {
    const deltaItem = wardDeltas.find((w) => w.cellId === cell.id);
    if (!deltaItem) return cell;
    return {
      ...cell,
      riskScore: deltaItem.scenarioRisk,
      floodDepthM: Number((deltaItem.inundationDepthCm / 100).toFixed(2)),
      forecastRainfall24h: Number((cell.forecastRainfall24h * rainfallMultiplier).toFixed(1)),
    };
  });

  return {
    id: `sim-${Date.now()}`,
    scenarioName,
    timestamp: new Date().toISOString(),
    scenarioInputs: inputs,
    updatedCells,
    summary: {
      baselineAvgRisk,
      scenarioAvgRisk,
      riskDeltaPct,
      criticalWardsCount: criticalWards,
      inundatedAreaSqKm: Number(totalInundatedAreaSqKm.toFixed(1)),
      sparedPopulationEst: sparedPopulation,
      mitigatedEconomicRiskCr,
    },
    wardDeltas,
  };
}
