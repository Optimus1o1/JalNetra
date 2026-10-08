import { getPrismaClient, isDatabaseConnected } from "@/lib/db";
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
  {
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
      status: "FLAGGED_ANOMALY",
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
  const prisma = getPrismaClient();
  if (!prisma) return;

  try {
    const node = await prisma.sensorNode.findUnique({
      where: { nodeKey: params.sensorId },
      select: { id: true },
    });

    if (node) {
      await prisma.sensorObservation.create({
        data: {
          sensorId: node.id,
          parameter: params.metric,
          value: params.value,
          unit: params.metric.endsWith("M") ? "m" : params.metric.endsWith("L") ? "L" : "cumec",
          qualityFlag: params.qualityFlag,
          timestamp: new Date(params.processedAt),
          rawTelemetry: (params.rawPayload as any) || undefined,
        },
      });

      const updateData: Record<string, unknown> = {
        lastPingAt: new Date(params.processedAt),
      };
      if (params.metric === "waterLevelM") updateData.lastWaterLevelM = params.value;
      if (params.metric === "dischargeCumec") updateData.lastDischargeCumec = params.value;
      if (params.batteryPct !== undefined) updateData.batteryPct = params.batteryPct;

      await prisma.sensorNode.update({
        where: { id: node.id },
        data: updateData,
      });
    }
  } catch (err) {
    console.warn("[JalNetra Telemetry] Error writing observation to database:", err);
  }
}

export async function fetchLiveSensors(): Promise<SensorNode[]> {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const dbNodes = await prisma.sensorNode.findMany({
        include: { ward: true },
        orderBy: { name: "asc" },
      });

      if (dbNodes && dbNodes.length > 0) {
        return dbNodes.map((node) => {
          const cached = inMemoryLatestObservations[node.nodeKey];
          return {
            id: node.nodeKey,
            name: node.name,
            type: node.type as any,
            wardNumber: node.ward?.wardNumber || 66,
            coordinates: [node.latitude, node.longitude],
            elevation: node.elevationM,
            status: node.status.toLowerCase() as any,
            batteryPct: node.batteryPct,
            lastWaterLevel: cached?.waterLevelM ?? node.lastWaterLevelM ?? 1.2,
            lastDischarge: cached?.dischargeCumec ?? node.lastDischargeCumec ?? 4.5,
            tankLevelM: cached?.tankLevelM,
            availableCapacityL: cached?.availableCapacityL,
            lastPing: cached?.lastUpdated || node.lastPingAt.toISOString(),
            qualityFlag: (cached?.qualityFlag || "GOOD") as any,
          };
        });
      }
    } catch (err) {
      console.warn("[JalNetra Telemetry] DB sensor query failed, falling back to static fleet:", err);
    }
  }

  // Fallback to in-memory sensor fleet merged with latest observations
  return IOT_SENSOR_NODES.map((sensor) => {
    const cached = inMemoryLatestObservations[sensor.id];
    if (cached) {
      return {
        ...sensor,
        lastWaterLevel: cached.waterLevelM ?? sensor.lastWaterLevel,
        lastDischarge: cached.dischargeCumec ?? sensor.lastDischarge,
        tankLevelM: cached.tankLevelM ?? sensor.tankLevelM,
        availableCapacityL: cached.availableCapacityL ?? sensor.availableCapacityL,
        lastPing: cached.lastUpdated,
        qualityFlag: cached.qualityFlag as any,
      };
    }
    return sensor;
  });
}
