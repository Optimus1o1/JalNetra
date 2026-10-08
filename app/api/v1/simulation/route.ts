import { NextRequest, NextResponse } from "next/server";
import { executeAndLogSimulation, getRecentSimulationRuns } from "@/lib/services/simulationService";
import { SimulationScenarioRequest } from "@/lib/types";
import { clampNumber } from "@/lib/security/sanitize";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SimulationScenarioRequest>;

    const inputs: SimulationScenarioRequest = {
      rainfallMultiplier: clampNumber(body.rainfallMultiplier, 0.1, 10.0, 1.25),
      durationHours: Math.round(clampNumber(body.durationHours, 1, 72, 6)),
      drainageEfficiencyPct: clampNumber(body.drainageEfficiencyPct, -100, 100, -15),
      tidalSurgeMeters: clampNumber(body.tidalSurgeMeters, -2.0, 10.0, 0.8),
      emergencyPumpsActive: Boolean(
        body.emergencyPumpsActive || (body.emergencyPumpingCusec !== undefined && body.emergencyPumpingCusec > 0)
      ),
      sluiceGatesAutomated: Boolean(body.sluiceGatesAutomated ?? true),
      permeablePavementScenario: Boolean(body.permeablePavementScenario),
      temporaryBundsDeployed: Boolean(body.temporaryBundsDeployed),
      emergencyPumpingCusec: body.emergencyPumpingCusec,
      desiltingFactor: body.desiltingFactor,
      upstreamRetentionPct: body.upstreamRetentionPct,
      tidalStageM: body.tidalStageM,
    };

    const { result, runId } = await executeAndLogSimulation(
      inputs,
      body.temporaryBundsDeployed ? "Emergency Civil Defense Deployment" : "Standard Nowcast Simulation"
    );

    const criticalWardsCount = result.summary.criticalWardsCount;
    const mitigatedWardsCount = result.wardDeltas.filter(
      (w) => w.status === "mitigated" || w.delta < 0 || (w.interventionBenefit !== undefined && w.interventionBenefit > 0)
    ).length;

    return NextResponse.json({
      status: "success",
      runId,
      scenarioName: result.scenarioName,
      updatedCells: result.updatedCells,
      averageRiskScore: result.summary.scenarioAvgRisk,
      criticalWardsCount,
      mitigatedWardsCount,
      simulation: {
        ...result,
        sparedPopulation: result.summary.sparedPopulationEst,
        avoidedLossCrores: result.summary.mitigatedEconomicRiskCr,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute scenario simulation", details: String(error) },
      { status: 400 }
    );
  }
}

export async function GET() {
  const defaultInputs: SimulationScenarioRequest = {
    rainfallMultiplier: 1.2,
    durationHours: 6,
    drainageEfficiencyPct: -10,
    tidalSurgeMeters: 0.6,
    emergencyPumpsActive: true,
    sluiceGatesAutomated: true,
    permeablePavementScenario: false,
    temporaryBundsDeployed: false,
  };

  const { result } = await executeAndLogSimulation(defaultInputs, "Executive Benchmark Run");
  const recentRuns = await getRecentSimulationRuns(5);

  return NextResponse.json({
    status: "success",
    defaultBenchmark: result,
    recentHistory: recentRuns,
  });
}
