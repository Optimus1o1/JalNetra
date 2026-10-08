import { NextResponse } from 'next/server';
import { calculateStorageBalance } from '@/lib/domain/storageBalance';
import { calculateOpportunity } from '@/lib/domain/rainwaterEngine';
import { fetchCatchmentSites } from '@/lib/services/rainwaterDataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || 'park-circus-basin';
    const rainfallParam = searchParams.get('rainfallMm');
    const storageParam = searchParams.get('storageCapacityML');
    const demandParam = searchParams.get('dailyDemandML');

    const rainfallMm = rainfallParam ? parseFloat(rainfallParam) : 50;
    const storageCapacityML = storageParam ? parseFloat(storageParam) : 10;
    const dailyDemandML = demandParam ? parseFloat(demandParam) : 0.5;

    const { sites, fromDatabase } = await fetchCatchmentSites();
    const site = sites.find((s) => s.id === siteId) || sites[0];

    const opportunity = calculateOpportunity(site, rainfallMm);
    const initialStorageML = site.existingStorageML;

    const balance = calculateStorageBalance(
      opportunity.harvestablePotentialML,
      storageCapacityML,
      dailyDemandML,
      initialStorageML
    );

    return NextResponse.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        ward: site.ward,
        rainfallMm,
        inflowML: opportunity.harvestablePotentialML,
        storageCapacityML,
        dailyDemandML,
        initialStorageML,
        retainedML: balance.retainedML,
        overflowML: balance.overflowML,
        deficitML: balance.deficitML,
        finalStorageML: balance.finalStorageML,
        circularSatisfactionRate: balance.circularSatisfactionRate,
        daysOfResilience: balance.daysOfResilience,
        massBalanceErrorML: balance.massBalanceErrorML,
        operationalMode: fromDatabase ? 'DATABASE_MODE' : 'IN_MEMORY_FALLBACK',
        dataSource: fromDatabase ? 'POSTGRESQL_POSTGIS' : 'LOCAL_GEOJSON_MEMORY',
      },
      provenance: 'SIMULATED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to calculate water balance', message: String(error) },
      { status: 500 }
    );
  }
}
