import { NextRequest, NextResponse } from "next/server";
import { ingestTelemetry, TelemetryPayload } from "@/lib/services/telemetryService";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TelemetryPayload;
    const result = await ingestTelemetry(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, status: result.status, check: result.qualityCheck },
        { status: result.qualityCheck.includes("OUT_OF_BOUNDS") ? 422 : 400 }
      );
    }

    return NextResponse.json({
      status: "ingested",
      receiptId: result.receiptId,
      sensorId: result.sensorId,
      processedTimestamp: result.processedAt,
      qualityCheck: result.qualityCheck,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Malformed observation telemetry payload", details: String(error) },
      { status: 400 }
    );
  }
}
