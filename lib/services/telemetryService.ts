import crypto from 'node:crypto';
import { sensorNodes } from '../data/sensorNodesData';
import { SensorNode } from '../types';

export interface TelemetryObservation {
  stationId: string;
  parameter: 'RAINFALL_RATE_MM_HR' | 'WATER_LEVEL_METERS' | 'SOIL_MOISTURE_PCT';
  value: number;
  qualityFlag: 'GOOD' | 'SUSPECT' | 'ERRONEOUS';
  timestamp: string;
}

// Bounded in-memory ring buffer of recent sensor telemetry (max 100 observations)
const MAX_OBSERVATIONS = 100;
const observationRingBuffer: TelemetryObservation[] = [];

// Seed initial buffer with current calibrated baseline readings
sensorNodes.forEach((node) => {
  observationRingBuffer.push({
    stationId: node.id,
    parameter: 'RAINFALL_RATE_MM_HR',
    value: node.lastReadingMm,
    qualityFlag: node.status === 'ONLINE' ? 'GOOD' : 'SUSPECT',
    timestamp: node.lastUpdated,
  });
});

export function getSensorNodes(): SensorNode[] {
  return sensorNodes;
}

export function getLatestObservations(stationId?: string): TelemetryObservation[] {
  if (stationId) {
    return observationRingBuffer.filter((obs) => obs.stationId === stationId);
  }
  return [...observationRingBuffer];
}

/**
 * Ingests incoming sensor telemetry observations with bounded memory protection.
 */
export function ingestObservation(obs: TelemetryObservation): void {
  if (observationRingBuffer.length >= MAX_OBSERVATIONS) {
    observationRingBuffer.shift(); // Evict oldest
  }
  observationRingBuffer.push(obs);
}

/**
 * Authenticates and ingests telemetry data from IoT nodes or SCADA systems.
 * Supports Bearer API key or HMAC-SHA256 signature verification.
 */
export function ingestObservationsWithAuth(
  rawBody: string,
  authHeader: string | null,
  signatureHeader: string | null
): { success: boolean; status: number; error?: string; data?: TelemetryObservation[] } {
  const expectedApiKey = process.env.TELEMETRY_API_KEY || 'jalnetra-dev-telemetry-secret';
  const hmacSecret = process.env.TELEMETRY_HMAC_SECRET || expectedApiKey;

  let authenticated = false;

  // 1. Bearer / API-Key validation
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (token === expectedApiKey) {
      authenticated = true;
    }
  }

  // 2. HMAC-SHA256 validation if signature header present
  if (!authenticated && signatureHeader) {
    try {
      const calculatedSig = crypto.createHmac('sha256', hmacSecret).update(rawBody).digest('hex');
      if (calculatedSig.toLowerCase() === signatureHeader.trim().toLowerCase()) {
        authenticated = true;
      }
    } catch {
      // Signature error handled as unauthenticated
    }
  }

  if (!authenticated) {
    return {
      success: false,
      status: 401,
      error: 'Unauthorized: Invalid or missing telemetry authorization credentials',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      success: false,
      status: 400,
      error: 'Malformed JSON payload',
    };
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  const ingested: TelemetryObservation[] = [];

  for (const item of items) {
    if (!item.stationId || typeof item.value !== 'number') {
      return {
        success: false,
        status: 422,
        error: 'Invalid observation schema: stationId and numeric value required',
      };
    }

    const obs: TelemetryObservation = {
      stationId: String(item.stationId),
      parameter: item.parameter || 'RAINFALL_RATE_MM_HR',
      value: Number(item.value),
      qualityFlag: item.qualityFlag || 'GOOD',
      timestamp: item.timestamp || new Date().toISOString(),
    };

    ingestObservation(obs);
    ingested.push(obs);
  }

  return {
    success: true,
    status: 200,
    data: ingested,
  };
}
