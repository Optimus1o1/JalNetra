import { NextResponse } from 'next/server';
import { calculateInterventions } from '@/lib/domain/interventionPlanner';
import { fetchInterventions } from '@/lib/services/rainwaterDataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wardParam = searchParams.get('ward');
    const budgetParam = searchParams.get('budgetCr');
    const wardId = wardParam ? parseInt(wardParam, 10) : undefined;
    const maxBudgetCr = budgetParam ? parseFloat(budgetParam) : 50;

    const { interventions: rawInterventions, fromDatabase } = await fetchInterventions(wardId);
    const plan = calculateInterventions(rawInterventions, maxBudgetCr);

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        operationalMode: fromDatabase ? 'DATABASE_MODE' : 'IN_MEMORY_FALLBACK',
        dataSource: fromDatabase ? 'POSTGRESQL_POSTGIS' : 'LOCAL_GEOJSON_MEMORY',
      },
      provenance: 'SIMULATED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate intervention plan', message: String(error) },
      { status: 500 }
    );
  }
}
