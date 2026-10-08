import { getPgPool, OperationalMode } from "../db";
import { IOT_SENSOR_NODES } from "../data/sensorNodesData";
import { SensorNode, SensorType } from "../types";

export interface SensorsRepoResult {
  sensors: SensorNode[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

function mapRowToSensorNode(row: any): SensorNode {
  const baseNode = IOT_SENSOR_NODES.find((s) => s.id === row.node_key);
  const statusStr = (row.status || "").toLowerCase();
  const statusVal: "online" | "warning" | "offline" =
    statusStr === "online" ? "online" : statusStr === "warn" || statusStr === "warning" ? "warning" : "offline";

  return {
    id: row.node_key,
    stationCode: baseNode?.stationCode || `STN-${row.node_key.toUpperCase()}`,
    name: row.name || baseNode?.name || row.node_key,
    type: (row.type || baseNode?.type || "stormwater_sump") as SensorType,
    coordinates: [Number(row.latitude), Number(row.longitude)],
    status: statusVal,
    waterLevelM: row.last_water_level_m !== null ? Number(row.last_water_level_m) : (baseNode?.waterLevelM ?? 2.5),
    dangerLevelM: baseNode?.dangerLevelM ?? 5.5,
    warningLevelM: baseNode?.warningLevelM ?? 4.5,
    flowVelocityMs: baseNode?.flowVelocityMs ?? 1.2,
    dischargeCusecs:
      row.last_discharge_cumec !== null
        ? Math.round(Number(row.last_discharge_cumec) * 35.3147)
        : (baseNode?.dischargeCusecs ?? 2500),
    turbidityNtu: baseNode?.turbidityNtu ?? 45.0,
    dissolvedOxygenMgL: baseNode?.dissolvedOxygenMgL ?? 5.0,
    batteryPct: row.battery_pct !== null ? Number(row.battery_pct) : (baseNode?.batteryPct ?? 100),
    lastPing: row.last_ping_at ? new Date(row.last_ping_at).toISOString() : (baseNode?.lastPing ?? new Date().toISOString()),
    anomalyDetected: baseNode?.anomalyDetected ?? false,
    anomalyMessage: baseNode?.anomalyMessage,
  };
}

export async function getActiveSensorFleet(): Promise<SensorsRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT node_key, name, type, status, latitude, longitude,
               battery_pct, last_water_level_m, last_discharge_cumec, last_ping_at
        FROM sensor_nodes
        WHERE node_key LIKE 'sn-%'
        ORDER BY node_key ASC
        LIMIT 12
      `;
      const res = await pool.query(query);
      if (res.rows && res.rows.length === 12) {
        return {
          sensors: res.rows.map(mapRowToSensorNode),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[SensorRepository] getActiveSensorFleet failed, falling back:", err);
    }
  }

  return {
    sensors: IOT_SENSOR_NODES,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getSensorObservations(sensorKey: string, limit = 50): Promise<any[]> {
  const pool = getPgPool();
  if (!pool) return [];

  try {
    const nodeRes = await pool.query("SELECT id FROM sensor_nodes WHERE node_key = $1 LIMIT 1", [sensorKey]);
    const nodeId = nodeRes.rows[0]?.id;
    if (!nodeId) return [];

    const res = await pool.query(
      `SELECT recorded_at, water_level_m, discharge_rate_cumec, quality_flag, provenance
       FROM sensor_observations
       WHERE sensor_id = $1
       ORDER BY recorded_at DESC
       LIMIT $2`,
      [nodeId, Math.max(1, Math.min(limit, 100))]
    );
    return res.rows;
  } catch (err) {
    console.warn(`[SensorRepository] getSensorObservations failed for ${sensorKey}:`, err);
    return [];
  }
}
