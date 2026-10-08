import { getPgPool } from "../db";

export interface PersistedScenarioRecord {
  scenarioHash: string;
  scenarioName: string;
  wardNumber: number;
  rainfallEventMm: number;
  calculationVersion: string;
  modelVersion: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  provenance: string;
  createdAt?: string;
}

export interface SaveScenarioInput {
  scenarioHash: string;
  scenarioName: string;
  wardNumber: number;
  rainfallEventMm: number;
  calculationVersion: string;
  modelVersion: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  provenance?: string;
}

export async function findByHash(scenarioHash: string): Promise<PersistedScenarioRecord | null> {
  const pool = getPgPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT scenario_hash, scenario_name, ward_number, rainfall_event_mm,
              calculation_version, model_version, inputs, results, provenance, created_at
       FROM persisted_scenarios
       WHERE scenario_hash = $1
       LIMIT 1`,
      [scenarioHash]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const parsedInputs = typeof row.inputs === "string" ? JSON.parse(row.inputs) : row.inputs;
      const parsedResults = typeof row.results === "string" ? JSON.parse(row.results) : row.results;

      return {
        scenarioHash: row.scenario_hash,
        scenarioName: row.scenario_name,
        wardNumber: Number(row.ward_number),
        rainfallEventMm: Number(row.rainfall_event_mm),
        calculationVersion: row.calculation_version,
        modelVersion: row.model_version,
        inputs: parsedInputs,
        results: parsedResults,
        provenance: row.provenance || "SIMULATED",
        createdAt: row.created_at?.toISOString?.() || String(row.created_at),
      };
    }
  } catch (err) {
    console.warn(`[ScenarioRepository] findByHash failed for hash ${scenarioHash}:`, err);
  }
  return null;
}

export async function saveScenario(data: SaveScenarioInput): Promise<boolean> {
  const pool = getPgPool();
  if (!pool) return false;

  try {
    await pool.query(
      `INSERT INTO persisted_scenarios (
        scenario_hash,
        scenario_name,
        ward_number,
        rainfall_event_mm,
        calculation_version,
        model_version,
        inputs,
        results,
        provenance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (scenario_hash) DO UPDATE SET
        scenario_name = EXCLUDED.scenario_name,
        rainfall_event_mm = EXCLUDED.rainfall_event_mm,
        inputs = EXCLUDED.inputs,
        results = EXCLUDED.results`,
      [
        data.scenarioHash,
        data.scenarioName,
        data.wardNumber,
        data.rainfallEventMm,
        data.calculationVersion,
        data.modelVersion,
        JSON.stringify(data.inputs),
        JSON.stringify(data.results),
        data.provenance || "SIMULATED",
      ]
    );
    return true;
  } catch (err) {
    console.warn("[ScenarioRepository] saveScenario failed:", err);
    return false;
  }
}

export async function listRecentScenarios(limit = 10): Promise<PersistedScenarioRecord[]> {
  const pool = getPgPool();
  if (!pool) return [];

  try {
    const res = await pool.query(
      `SELECT scenario_hash, scenario_name, ward_number, rainfall_event_mm,
              calculation_version, model_version, inputs, results, provenance, created_at
       FROM persisted_scenarios
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.max(1, Math.min(limit, 50))]
    );

    return res.rows.map((row) => ({
      scenarioHash: row.scenario_hash,
      scenarioName: row.scenario_name,
      wardNumber: Number(row.ward_number),
      rainfallEventMm: Number(row.rainfall_event_mm),
      calculationVersion: row.calculation_version,
      modelVersion: row.model_version,
      inputs: typeof row.inputs === "string" ? JSON.parse(row.inputs) : row.inputs,
      results: typeof row.results === "string" ? JSON.parse(row.results) : row.results,
      provenance: row.provenance || "SIMULATED",
      createdAt: row.created_at?.toISOString?.() || String(row.created_at),
    }));
  } catch (err) {
    console.warn("[ScenarioRepository] listRecentScenarios failed:", err);
    return [];
  }
}
