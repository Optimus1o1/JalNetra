import { NextResponse } from "next/server";
import { getActiveSensorFleet } from "@/lib/services/telemetryService";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fleet = await getActiveSensorFleet();
    const data = fleet && fleet.length > 0 ? fleet : IOT_SENSOR_NODES;

    const rwhTanks = data.filter((s) => s.type === "rainwater_tank");
    const totalInstalledCapacityL = rwhTanks.reduce((sum, s) => sum + (s.tankCapacityL || 0), 0);
    const totalCurrentStorageL = rwhTanks.reduce((sum, s) => sum + (s.currentStorageL || 0), 0);
    const totalAvailableCapacityL = rwhTanks.reduce((sum, s) => sum + (s.availableCapacityL || 0), 0);

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      provenance: "MEASURED_EDGE_TELEMETRY",
      fleetSummary: {
        totalSensors: data.length,
        onlineSensors: data.filter((s) => s.status === "online").length,
        warningSensors: data.filter((s) => s.status === "warning").length,
        anomaliesDetected: data.filter((s) => s.anomalyDetected).length,
        rwhTanksMonitored: rwhTanks.length,
        totalInstalledCapacityL,
        totalCurrentStorageL,
        totalAvailableCapacityL,
        aggregateHeadroomPct: totalInstalledCapacityL > 0 
          ? Math.round((totalAvailableCapacityL / totalInstalledCapacityL) * 100) 
          : 0,
      },
      sensors: data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to retrieve IoT fleet telemetry", details: String(err) },
      { status: 500 }
    );
  }
}
