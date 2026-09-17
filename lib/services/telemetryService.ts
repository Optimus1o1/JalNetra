import { getPrismaClient, isDatabaseConnected } from "@/lib/db";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";
import { SensorNode } from "@/lib/types";

export interface TelemetryPayload {
  sensorId: string;
  metric: "waterLevelM" | "dischargeCumec" | "siltDepthCm" | "pumpRatePct" | "salinityPpt";
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

  // 1. Physical Sanity Threshold Checks
  if (metric === "waterLevelM") {
    if (value < 0.0 || value > 25.0) {
      return {
        success: false,
        status: "REJECTED_QC",
        receiptId,
        sensorId,
        processedAt,
        qualityCheck: "OUT_OF_BOUNDS_PHYSICS_VIOLATION",
        message: `Quality control rejected impossible water level reading (${value}m). Allowed bounds: [0.0m - 25.0m].`,
      };
    }
  }

  if (metric === "dischargeCumec") {
    if (value < 0.0 || value > 500.0) {
      return {
        success: false,
        status: "REJECTED_QC",
        receiptId,
        sensorId,
        processedAt,
        qualityCheck: "OUT_OF_BOUNDS_DISCHARGE",
        message: `Quality control rejected discharge rate (${value} m³/s). Allowed bounds: [0.0 - 500.0 m³/s].`,
      };
    }
  }

  // 2. Rate-of-Change Spike Filter
  const prevObservation = inMemoryLatestObservations[sensorId];
  let finalQualityFlag = qualityFlag || "QC_PASSED";

  if (prevObservation && metric === "waterLevelM" && prevObservation.waterLevelM !== undefined) {
    const delta = Math.abs(value - prevObservation.waterLevelM);
    if (delta > 5.0) {
      finalQualityFlag = "SUSPECT_SPIKE_FILTERED";
    }
  }

  // 3. Update Operational Memory Cache
  inMemoryLatestObservations[sensorId] = {
    ...prevObservation,
    waterLevelM: metric === "waterLevelM" ? value : prevObservation?.waterLevelM,
    dischargeCumec: metric === "dischargeCumec" ? value : prevObservation?.dischargeCumec,
    lastUpdated: processedAt,
    qualityFlag: finalQualityFlag,
  };

  // 4. Persist to PostgreSQL via Prisma if database is connected
  const prisma = getPrismaClient();
  if (isDatabaseConnected() && prisma) {
    try {
      await prisma.sensorObservation.create({
        data: {
          sensor: {
            connectOrCreate: {
              where: { nodeKey: sensorId },
              create: {
                nodeKey: sensorId,
                name: `IoT Node ${sensorId}`,
                type: metric === "dischargeCumec" ? "CANAL_STAGE" : "SUMP",
                latitude: 22.541,
                longitude: 88.398,
                elevationM: 3.2,
                status: finalQualityFlag === "SUSPECT_SPIKE_FILTERED" ? "WARN" : "ONLINE",
                lastWaterLevelM: metric === "waterLevelM" ? value : null,
                lastDischargeCumec: metric === "dischargeCumec" ? value : null,
                batteryPct: batteryPct ?? 100,
              },
            },
          },
          waterLevelM: metric === "waterLevelM" ? value : null,
          dischargeRateCumec: metric === "dischargeCumec" ? value : null,
          qualityFlag: finalQualityFlag,
          rawPayload: payload.rawPayload ? (payload.rawPayload as object) : undefined,
        },
      });

      // Update parent node status
      await prisma.sensorNode.updateMany({
        where: { nodeKey: sensorId },
        data: {
          lastPingAt: new Date(),
          batteryPct: batteryPct ?? undefined,
          lastWaterLevelM: metric === "waterLevelM" ? value : undefined,
          lastDischargeCumec: metric === "dischargeCumec" ? value : undefined,
          status: finalQualityFlag === "SUSPECT_SPIKE_FILTERED" ? "WARN" : "ONLINE",
        },
      });
    } catch (dbErr) {
      console.warn("[TelemetryService] Error persisting observation to DB; cached in-memory.", dbErr);
    }
  }

  return {
    success: true,
    status: finalQualityFlag === "SUSPECT_SPIKE_FILTERED" ? "FLAGGED_ANOMALY" : "INGESTED",
    receiptId,
    sensorId,
    processedAt,
    qualityCheck: finalQualityFlag,
    message: `Observation for ${sensorId} [${metric}: ${value} ${payload.unit || ""}] validated and ingested.`,
  };
}

export async function getActiveSensorFleet(): Promise<SensorNode[]> {
  const prisma = getPrismaClient();
  if (isDatabaseConnected() && prisma) {
    try {
      const nodes = await prisma.sensorNode.findMany({
        take: 50,
        orderBy: { lastPingAt: "desc" },
      });
      if (nodes.length > 0) {
        return nodes.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: n.type as SensorNode["type"],
          wardNumber: 66,
          latitude: n.latitude,
          longitude: n.longitude,
          waterLevelM: n.lastWaterLevelM ?? 2.1,
          dischargeRateCumec: n.lastDischargeCumec ?? 14.5,
          pumpCapacityCumec: 28.0,
          status: n.status as SensorNode["status"],
          lastPing: n.lastPingAt.toISOString(),
          batteryPct: n.batteryPct,
        }));
      }
    } catch (err) {
      console.warn("[TelemetryService] Database read failed, returning calibrated fleet.", err);
    }
  }

  // Resilient fallback to calibrated sensor fleet
  return IOT_SENSOR_NODES;
}
