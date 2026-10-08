import { getPrismaClient, isDatabaseConnected, getPgPool } from "@/lib/db";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";
import { SensorNode } from "@/lib/types";

export interface TelemetryPayload {
  sensorId: string;
  metric:
    | "waterLevelM"
    | "dischargeCumec"
    | "siltDepthCm"
    | "pumpRatePct"
    | "salinityPpt"
    | "tankLevelM"
    | "availableCapacityL"
    | "rainfallMm";
  value: number;
  unit?: string;
  batteryPct?: number;
  qualityFlag?: string;
  rawPayload?: Record<string, unknown>;
}

export interface IngestionResult {
  success: boolean;
  status: "INGESTED" | "REJECTED_QC" | "FLAGGED_ANOMALY";
  receiptId: string;
  sensorId: string;
  processedAt: string;
  qualityCheck: string;
  message: string;
}

// In-memory operational ring buffer for ultra-low latency edge lookups
const inMemoryLatestObservations: Record<
  string,
  Record<string, any> & {
    waterLevelM?: number;
    dischargeCumec?: number;
    tankLevelM?: number;
    availableCapacityL?: number;
    rainfallMm?: number;
    lastUpdated: string;
    qualityFlag: string;
  }
> = {};

export async function ingestTelemetry(payload: TelemetryPayload): Promise<IngestionResult> {
  const { sensorId, metric, value, batteryPct, qualityFlag } = payload;
  const processedAt = new Date().toISOString();
  const receiptId = `rcpt-tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  if (!sensorId || value === undefined || isNaN(value)) {
    return {
      success: false,
      status: "REJECTED_QC",
      receiptId,
      sensorId: sensorId || "UNKNOWN",
      processedAt,
      qualityCheck: "MISSING_MANDATORY_PARAMETERS",
      message: "Telemetry rejection: sensorId and numerical value are required.",
    };
  }

  // Physical validation bounds
  let isPhysicalAnomaly = false;
  let qcStatus = "PASSED_LEVEL_1_QC";

  if (metric === "waterLevelM" && (value < 0 || value > 25.0)) {
    isPhysicalAnomaly = true;
    qcStatus = "OUT_OF_BOUNDS_WATER_LEVEL";
  } else if (metric === "dischargeCumec" && (value < 0 || value > 150.0)) {
    isPhysicalAnomaly = true;
    qcStatus = "OUT_OF_BOUNDS_DISCHARGE";
  } else if (metric === "tankLevelM" && (value < 0 || value > 15.0)) {
    isPhysicalAnomaly = true;
    qcStatus = "OUT_OF_BOUNDS_TANK_LEVEL";
  } else if (metric === "rainfallMm" && (value < 0 || value > 300.0)) {
    isPhysicalAnomaly = true;
    qcStatus = "OUT_OF_BOUNDS_RAINFALL";
  }

  if (isPhysicalAnomaly) {
    return {
      success: false,
      status: "REJECTED_QC",
      receiptId,
      sensorId,
      processedAt,
      qualityCheck: qcStatus,
      message: `Physical range check failed: ${metric} value ${value} is outside plausible Kolkata hydraulic bounds.`,
    };
  }

  // Update in-memory cache
  if (!inMemoryLatestObservations[sensorId]) {
    inMemoryLatestObservations[sensorId] = {
      lastUpdated: processedAt,
      qualityFlag: qualityFlag || "GOOD",
    };
  }
  inMemoryLatestObservations[sensorId][metric] = value;
  inMemoryLatestObservations[sensorId].lastUpdated = processedAt;
  inMemoryLatestObservations[sensorId].qualityFlag = qualityFlag || "GOOD";

  // Asynchronous persistent database write (PostgreSQL)
  if (isDatabaseConnected()) {
    persistObservationToDatabase({
      sensorId,
      metric,
      value,
      batteryPct,
      qualityFlag: qualityFlag || "GOOD",
      rawPayload: payload.rawPayload,
      processedAt,
    }).catch((err) => {
      console.warn(`[JalNetra Telemetry] Background persistence warning for sensor ${sensorId}:`, err);
    });
  }

  return {
    success: true,
    status: "INGESTED",
    receiptId,
    sensorId,
    processedAt,
    qualityCheck: qcStatus,
    message: `Telemetry metric ${metric} successfully accepted and routed to digital twin live telemetry stream.`,
  };
}

async function persistObservationToDatabase(params: {
  sensorId: string;
  metric: string;
  value: number;
  batteryPct?: number;
  qualityFlag: string;
  rawPayload?: Record<string, unknown>;
  processedAt: string;
}): Promise<void> {
  const pool = getPgPool();
  if (!pool) return;

  try {
    const nodeRes = await pool.query(
      "SELECT id FROM sensor_nodes WHERE node_key = $1 LIMIT 1",
      [params.sensorId]
    );
    const nodeId = nodeRes.rows[0]?.id;

    if (nodeId) {
      const waterLevel = params.metric === "waterLevelM" ? params.value : null;
      const discharge = params.metric === "dischargeCumec" ? params.value : null;

      await pool.query(
        `INSERT INTO sensor_observations (sensor_id, recorded_at, water_level_m, discharge_rate_cumec, quality_flag, raw_payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          nodeId,
          params.processedAt,
          waterLevel,
          discharge,
          params.qualityFlag,
          JSON.stringify(params.rawPayload || {}),
        ]
      );

      if (params.metric === "waterLevelM") {
        await pool.query(
          "UPDATE sensor_nodes SET last_water_level_m = $1, last_ping_at = $2 WHERE id = $3",
          [params.value, params.processedAt, nodeId]
        );
      } else if (params.metric === "dischargeCumec") {
        await pool.query(
          "UPDATE sensor_nodes SET last_discharge_cumec = $1, last_ping_at = $2 WHERE id = $3",
          [params.value, params.processedAt, nodeId]
        );
      }
    }
  } catch (err) {
    console.warn("[JalNetra Telemetry] Error writing observation to database:", err);
  }
}

import { getActiveSensorFleet as getRepoSensorFleet } from "../repositories/sensorRepository";

export async function fetchLiveSensors(): Promise<SensorNode[]> {
  const repoResult = await getRepoSensorFleet();
  const baseFleet = repoResult.sensors;

  // Merge fleet with any live in-memory observations
  return baseFleet.map((sensor) => {
    const cached = inMemoryLatestObservations[sensor.id];
    if (cached) {
      return {
        ...sensor,
        waterLevelM: cached.waterLevelM ?? sensor.waterLevelM,
        dischargeCusecs: cached.dischargeCumec
          ? Math.round(cached.dischargeCumec * 35.3147)
          : sensor.dischargeCusecs,
        lastPing: cached.lastUpdated,
      };
    }
    return sensor;
  });
}

export const getActiveSensorFleet = fetchLiveSensors;

