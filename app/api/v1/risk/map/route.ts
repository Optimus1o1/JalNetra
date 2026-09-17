import { NextResponse } from "next/server";
import { PILOT_GRID_CELLS, PILOT_REGION_METADATA } from "@/lib/data/pilotRegionData";

export async function GET() {
  const geojson = {
    type: "FeatureCollection",
    metadata: PILOT_REGION_METADATA,
    features: PILOT_GRID_CELLS.map((cell) => ({
      type: "Feature",
      id: cell.id,
      geometry: {
        type: "Point",
        coordinates: [cell.coordinates[1], cell.coordinates[0]], // [lng, lat]
      },
      properties: {
        ...cell,
      },
    })),
  };

  return NextResponse.json(geojson);
}
