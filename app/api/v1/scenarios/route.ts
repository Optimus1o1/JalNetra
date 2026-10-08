import { NextResponse } from 'next/server';
import { runScenarioCalculation } from '@/lib/domain/scenarioCache';
import { getPersistedScenarioRecord, persistScenarioRecord } from '@/lib/services/rainwaterDataService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rainfallMm = Number(body.rainfallMm ?? 50);
    const storageCapacityML = Number(body.storageCapacityML ?? 10);
    const dailyDemandML = Number(body.dailyDemandML ?? 0.5);
    const siteId = body.siteId ? String(body.siteId) : 'park-circus-basin';
    const wardId = body.wardId ? Number(body.wardId) : 66;

    // Check DB persistent store first if not found in memory
    const dbRecord = await getPersistedScenarioRecord(rainfallMm, storageCapacityML, dailyDemandML);
    if (dbRecord) {
      return NextResponse.json({
        success: true,
        data: {
          ...dbRecord.resultPayload,
          operationalMode: 'DATABASE_MODE',
          cached: true,
          cacheTier: 'L2_PERSISTENT_POSTGRESQL',
        },
        provenance: 'SIMULATED',
        timestamp: new Date().toISOString(),
      });
    }

    const { result, cached, scenarioHash, executionTimeMs } = runScenarioCalculation({
      rainfallMm,
      storageCapacityML,
      dailyDemandML,
      siteId,
      wardId,
    });

    // Fire-and-forget persist to database
    persistScenarioRecord(scenarioHash, rainfallMm, storageCapacityML, dailyDemandML, result).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        scenarioHash,
        cached,
        cacheTier: cached ? 'L1_MEMORY_LRU' : 'COMPUTED',
        executionTimeMs,
        operationalMode: 'DATABASE_MODE',
      },
      provenance: 'SIMULATED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Scenario simulation failed', message: String(error) },
      { status: 500 }
    );
  }
}
