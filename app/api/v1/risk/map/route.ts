import { NextResponse } from "next/server";
import { PILOT_GRID_CELLS, PILOT_REGION_METADATA } from "@/lib/data/pilotRegionData";

export async function GET() {
  const geojson = {
    type: "FeatureCollection",
    metadata: PILOT_REGION_METADATA,
    features: PILOT_GRID_CELLS.map((cell) => {
      const lat = cell.coordinates[0];
      const lng = cell.coordinates[1];
      const dLat = 0.005;
      const dLng = 0.005;

      return {
        type: "Feature",
        id: cell.id,
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [Number((lng - dLng).toFixed(4)), Number((lat - dLat).toFixed(4))],
              [Number((lng + dLng).toFixed(4)), Number((lat - dLat).toFixed(4))],
              [Number((lng + dLng).toFixed(4)), Number((lat + dLat).toFixed(4))],
              [Number((lng - dLng).toFixed(4)), Number((lat + dLat).toFixed(4))],
              [Number((lng - dLng).toFixed(4)), Number((lat - dLat).toFixed(4))],
            ],
          ],
        },
        properties: {
          ...cell,
        },
      };
    }),
  };

  return NextResponse.json(geojson);
}
