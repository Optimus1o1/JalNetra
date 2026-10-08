import { NextResponse } from 'next/server';
import { calculateOpportunity } from '@/lib/domain/rainwaterEngine';
import { fetchCatchmentSites } from '@/lib/services/rainwaterDataService';

export async function GET() {
  try {
    const { sites, fromDatabase } = await fetchCatchmentSites();

    const opportunities = sites.map((site) => {
      const opp = calculateOpportunity(site, 50); // standard 50mm event
      return {
        ...opp,
        operationalMode: fromDatabase ? 'DATABASE_MODE' : 'IN_MEMORY_FALLBACK',
      };
    });

    const totalPotentialML = Number(
      opportunities.reduce((acc, curr) => acc + curr.harvestablePotentialML, 0).toFixed(2)
    );
    const totalRecommendedStorageML = Number(
      opportunities.reduce((acc, curr) => acc + curr.recommendedStorageML, 0).toFixed(2)
    );

    return NextResponse.json({
      success: true,
      data: {
        totalPotentialML,
        totalRecommendedStorageML,
        siteCount: opportunities.length,
        opportunities,
        operationalMode: fromDatabase ? 'DATABASE_MODE' : 'IN_MEMORY_FALLBACK',
        dataSource: fromDatabase ? 'POSTGRESQL_POSTGIS' : 'LOCAL_GEOJSON_MEMORY',
      },
      provenance: 'SIMULATED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opportunities', message: String(error) },
      { status: 500 }
    );
  }
}
