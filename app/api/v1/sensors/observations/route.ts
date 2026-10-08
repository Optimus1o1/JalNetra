import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ingestTelemetry, TelemetryPayload } from "@/lib/services/telemetryService";

/**
 * Constant-time string comparison to defend against timing side-channel attacks.
 */
function isAuthorizedToken(providedToken: string | null): boolean {
  if (!providedToken) return false;
  
  // Server-side secret key from environment variables
  const expectedKey = process.env.TELEMETRY_INGESTION_KEY || "jn_telemetry_edge_secure_2026";
  
  const providedBuf = Buffer.from(providedToken, "utf-8");
  const expectedBuf = Buffer.from(expectedKey, "utf-8");

  if (providedBuf.length !== expectedBuf.length) {
    // Perform dummy timing-safe equality to protect timing characteristics
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  // 1. Enforce Edge Sensor Ingestion Authentication
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Unauthorized: Missing Bearer token in Authorization header.",
        status: 401,
      },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7).trim();
  if (!isAuthorizedToken(token)) {
    return NextResponse.json(
      {
        error: "Unauthorized: Invalid telemetry ingestion token.",
        status: 401,
      },
      { status: 401 }
    );
  }

  // 2. Parse & Ingest Telemetry Payload
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
      provenance: "MEASURED",
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
