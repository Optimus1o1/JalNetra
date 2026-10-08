import { NextRequest, NextResponse } from "next/server";
import { getAllInterventions, FALLBACK_INTERVENTIONS } from "@/lib/repositories/interventionRepository";
import { InterventionOption } from "@/lib/domain/types";

// Preserve backward-compatible export for tests and legacy callers
export const MUNICIPAL_INTERVENTIONS: InterventionOption[] = FALLBACK_INTERVENTIONS;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const { interventions: list, operationalMode, fromDb } = await getAllInterventions(statusParam);

  const totalCost = list.reduce((sum, i) => sum + i.estimatedCostINR, 0);
  const totalAnnualHarvestML = list.reduce((sum, i) => sum + i.annualHarvestPotentialML, 0);
  const totalAnnualRunoffAvoidedML = list.reduce((sum, i) => sum + i.annualRunoffAvoidedML, 0);

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    operationalMode,
    dataSource: fromDb ? "POSTGRESQL_POSTGIS" : "IN_MEMORY_CALIBRATED_FALLBACK",
    totalInterventions: list.length,
    portfolioSummary: {
      totalInvestmentINR: totalCost,
      totalInvestmentLakhs: Number((totalCost / 100_000).toFixed(2)),
      totalAnnualHarvestPotentialML: Number(totalAnnualHarvestML.toFixed(2)),
      totalAnnualRunoffAvoidedML: Number(totalAnnualRunoffAvoidedML.toFixed(2)),
      averagePriorityScore: Math.round(
        list.reduce((sum, i) => sum + i.priorityScore, 0) / Math.max(1, list.length)
      ),
    },
    interventions: list,
  });
}
