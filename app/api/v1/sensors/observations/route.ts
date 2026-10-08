import { NextResponse } from 'next/server';
import { getLatestObservations, ingestObservationsWithAuth } from '@/lib/services/telemetryService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId') || undefined;

    const observations = getLatestObservations(stationId);

    return NextResponse.json({
      success: true,
      data: observations,
      count: observations.length,
      provenance: 'MEASURED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch observations', message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('x-api-key');
    const signature = request.headers.get('x-telemetry-signature');
    const rawBody = await request.text();

    const result = ingestObservationsWithAuth(rawBody, authHeader, signature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Observations ingested successfully',
      data: result.data,
      provenance: 'MEASURED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Telemetry ingestion failed', message: String(error) },
      { status: 500 }
    );
  }
}
