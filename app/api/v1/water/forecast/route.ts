import { NextResponse } from "next/server";
import { getActiveSensorFleet } from "@/lib/services/telemetryService";
import { getTidalHydrodynamics } from "@/lib/services/tidalHydroService";

export async function GET() {
  const [sensors, tidalState] = await Promise.all([
    getActiveSensorFleet(),
    getTidalHydrodynamics(),
  ]);

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    networkStatus: `${sensors.filter((s) => s.status === "online").length} / ${sensors.length} IoT Monitoring Nodes Online`,
    sensors,
    tidalDynamics: {
      station: tidalState.stationName,
      currentStageMSL: tidalState.stageMMSL,
      trend: tidalState.trend,
      nextHighTideTime: `In ${tidalState.minutesToHighTide} minutes`,
      predictedHighTideMeters: Number((tidalState.stageMMSL + 0.5).toFixed(2)),
      estSluiceLockoutDurationHours: tidalState.sluiceInterlockActive ? 3.5 : 0.0,
      sluiceInterlockActive: tidalState.sluiceInterlockActive,
      gateStatus: {
        sluice01: tidalState.gate01Status,
        sluice04: tidalState.gate04Status,
        sluice07: tidalState.gate07Status,
      },
      riverBackflowWarning: tidalState.warningMessage,
    },
  });
}
