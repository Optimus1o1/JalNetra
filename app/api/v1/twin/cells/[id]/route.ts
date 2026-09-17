import { NextRequest, NextResponse } from "next/server";
import { getWardCellById } from "@/lib/services/twinRiskService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const evaluation = await getWardCellById(id);

  if (!evaluation) {
    return NextResponse.json(
      { error: "Grid cell not found in pilot region register", requestedId: id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    cell: evaluation.cell,
    explainability: {
      framework: "TreeSHAP Local Attribution Decomposition",
      totalFactors: evaluation.shapFactors.length,
      primaryRiskDriver: evaluation.primaryDriver,
      mitigationPath: evaluation.recommendedIntervention,
      indices: {
        hazard: evaluation.hazardIndex,
        exposure: evaluation.exposureIndex,
        vulnerability: evaluation.vulnerabilityIndex,
        compositeRisk: evaluation.compositeRiskScore,
      },
    },
  });
}
