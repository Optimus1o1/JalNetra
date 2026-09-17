import { getPrismaClient, isDatabaseConnected } from "@/lib/db";
import { runSimulationScenario } from "@/lib/simulationEngine";
import { SimulationScenarioRequest, SimulationScenarioResult } from "@/lib/types";

export interface LoggedSimulationRun {
  id: string;
  scenarioName: string;
  createdBy: string;
  createdAt: string;
  inputs: SimulationScenarioRequest;
  outcomes: SimulationScenarioResult;
}

const inMemorySimulationHistory: LoggedSimulationRun[] = [];

export async function executeAndLogSimulation(
  inputs: SimulationScenarioRequest,
  scenarioName: string = "Dynamic Dispatch Scenario",
  operatorId: string = "INCIDENT_COMMANDER"
): Promise<{ result: SimulationScenarioResult; runId: string }> {
  const result = runSimulationScenario(inputs);
  const runId = `sim-run-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const loggedRun: LoggedSimulationRun = {
    id: runId,
    scenarioName,
    createdBy: operatorId,
    createdAt,
    inputs,
    outcomes: result,
  };

  inMemorySimulationHistory.unshift(loggedRun);
  if (inMemorySimulationHistory.length > 50) {
    inMemorySimulationHistory.pop();
  }

  const prisma = getPrismaClient();
  if (isDatabaseConnected() && prisma) {
    try {
      await prisma.simulationRun.create({
        data: {
          scenarioName,
          createdBy: operatorId,
          inputs: inputs as unknown as object,
          outcomes: result as unknown as object,
          dispatchedResources: inputs.emergencyPumpsActive
            ? { mobilePumps: 6, ndrfTeams: 2, sandbagBunds: 4 }
            : null,
        },
      });
    } catch (err) {
      console.warn("[SimulationService] Error persisting simulation run to DB, saved in-memory.", err);
    }
  }

  return { result, runId };
}

export async function getRecentSimulationRuns(limit: number = 10): Promise<LoggedSimulationRun[]> {
  return inMemorySimulationHistory.slice(0, limit);
}
