import { NextRequest, NextResponse } from "next/server";
import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cell = PILOT_GRID_CELLS.find((c) => c.id === id || String(c.wardNumber) === id);

  if (!cell) {
    return NextResponse.json(
      { error: "Grid cell not found in pilot region register", requestedId: id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    cell,
    explainability: {
      framework: "TreeSHAP Local Attribution Decomposition",
      totalFactors: cell.shapFactors.length,
      primaryRiskDriver: cell.shapFactors[0]?.name || "Rainfall Intensity",
      mitigationPath: "Increase pumping throughput or divert upstream canal gates.",
    },
  });
}
