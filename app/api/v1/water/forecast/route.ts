import { NextResponse } from "next/server";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";

export async function GET() {
  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    networkStatus: "8 / 8 IoT Monitoring Nodes Active",
    sensors: IOT_SENSOR_NODES,
    tidalDynamics: {
      nextHighTideTime: "17:42 IST",
      predictedHighTideMeters: 5.92,
      estSluiceLockoutDurationHours: 3.5,
      riverBackflowWarning: "Active for Chetla and Monikhali outfalls during high tide peak.",
    },
  });
}
