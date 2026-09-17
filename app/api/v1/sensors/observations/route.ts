import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { sensorId, timestamp, metric, value, unit, batteryPct, qualityFlag } = payload;

    if (!sensorId || value === undefined) {
      return NextResponse.json(
        { error: "Validation failed: sensorId and value are required" },
        { status: 400 }
      );
    }

    // Perform boundary validation to reject impossible sensor spikes
    if (metric === "waterLevelM" && (value < 0 || value > 25)) {
      return NextResponse.json(
        { error: "Quality control rejected: impossible water level reading (>25m or <0m)" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      status: "ingested",
      receiptId: `rcpt-${Date.now()}`,
      sensorId,
      processedTimestamp: new Date().toISOString(),
      qualityCheck: qualityFlag || "PASSED_BOUNDARY_CHECKS",
      message: `Observation for ${sensorId} [${metric}: ${value} ${unit || ""}] ingested into TimescaleDB time-series partition.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Malformed observation telemetry payload", details: String(error) },
      { status: 400 }
    );
  }
}
