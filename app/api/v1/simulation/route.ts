import { NextRequest, NextResponse } from "next/server";
import { runSimulationScenario } from "@/lib/simulationEngine";
import { SimulationScenarioRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SimulationScenarioRequest>;

    const inputs: SimulationScenarioRequest = {
      rainfallMultiplier: body.rainfallMultiplier ?? 1.25,
      durationHours: body.durationHours ?? 6,
      drainageEfficiencyPct: body.drainageEfficiencyPct ?? -15,
      tidalSurgeMeters: body.tidalSurgeMeters ?? 0.8,
      emergencyPumpsActive: body.emergencyPumpsActive ?? false,
      sluiceGatesAutomated: body.sluiceGatesAutomated ?? true,
      permeablePavementScenario: body.permeablePavementScenario ?? false,
      temporaryBundsDeployed: body.temporaryBundsDeployed ?? false,
    };

    const result = runSimulationScenario(inputs);
    return NextResponse.json({ status: "success", simulation: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute scenario simulation", details: String(error) },
      { status: 400 }
    );
  }
}

export async function GET() {
  // Return default benchmark run
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
  const result = runSimulationScenario(defaultInputs);
  return NextResponse.json({ status: "success", defaultBenchmark: result });
}
