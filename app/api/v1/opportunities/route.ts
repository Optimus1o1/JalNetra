import { NextRequest, NextResponse } from "next/server";
import {
  getAllSites,
  getSitesByWard,
  getSitesByViewport,
  CatchmentSitesRepoResult,
} from "@/lib/repositories/catchmentSiteRepository";
import { calculateHarvestableVolume, calculateWardHarvestableOpportunity } from "@/lib/domain/rainwaterEngine";
import { clampNumber } from "@/lib/security/sanitize";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wardParam = searchParams.get("ward");
  const rainfallParam = searchParams.get("rainfall");
  const bboxParam = searchParams.get("bbox");
  const minLatParam = searchParams.get("minLat");
  const minLngParam = searchParams.get("minLng");
  const maxLatParam = searchParams.get("maxLat");
  const maxLngParam = searchParams.get("maxLng");

  const rainfallMm = clampNumber(rainfallParam ? parseFloat(rainfallParam) : 45.0, 0, 500, 45.0);
  const targetWard = wardParam ? parseInt(wardParam, 10) : null;

  let queryResult: CatchmentSitesRepoResult;

  if (bboxParam) {
    const parts = bboxParam.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      const [minLng, minLat, maxLng, maxLat] = parts;
      queryResult = await getSitesByViewport(minLat, minLng, maxLat, maxLng);
    } else {
      queryResult = await getAllSites();
    }
  } else if (minLatParam && minLngParam && maxLatParam && maxLngParam) {
    const minLat = parseFloat(minLatParam);
    const minLng = parseFloat(minLngParam);
    const maxLat = parseFloat(maxLatParam);
    const maxLng = parseFloat(maxLngParam);
    if (!isNaN(minLat) && !isNaN(minLng) && !isNaN(maxLat) && !isNaN(maxLng)) {
      queryResult = await getSitesByViewport(minLat, minLng, maxLat, maxLng);
    } else {
      queryResult = await getAllSites();
    }
  } else if (targetWard !== null && !isNaN(targetWard)) {
    queryResult = await getSitesByWard(targetWard);
  } else {
    queryResult = await getAllSites();
  }

  const { sites: filteredSites, operationalMode, fromDb } = queryResult;

  if (filteredSites.length === 0) {
    const { sites: allSites } = await getAllSites();
    return NextResponse.json(
      {
        error: `No registered catchment sites found for ward ${targetWard}`,
        availableWards: Array.from(new Set(allSites.map((s) => s.wardNumber))),
        operationalMode,
      },
      { status: 404 }
    );
  }

  // Site opportunities
  const siteOpportunities = filteredSites.map((site) =>
    calculateHarvestableVolume(site, rainfallMm)
  );

  // Grouped by ward
  const wardNumbers = Array.from(new Set(filteredSites.map((s) => s.wardNumber)));
  const wardSummaries = wardNumbers.map((wNum) => {
    const sitesInWard = filteredSites.filter((s) => s.wardNumber === wNum);
    return calculateWardHarvestableOpportunity(sitesInWard, rainfallMm);
  });

  const totalHarvestableL = siteOpportunities.reduce((acc, curr) => acc + curr.harvestableVolumeL, 0);

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    operationalMode,
    dataSource: fromDb ? "POSTGRESQL_POSTGIS" : "IN_MEMORY_CALIBRATED_FALLBACK",
    eventRainfallMm: rainfallMm,
    totalCatchmentSites: filteredSites.length,
    basinHarvestableVolumeL: totalHarvestableL,
    basinHarvestableVolumeML: Number((totalHarvestableL / 1_000_000).toFixed(4)),
    wardSummaries,
    sites: siteOpportunities,
    provenance: "SIMULATED",
  });
}
