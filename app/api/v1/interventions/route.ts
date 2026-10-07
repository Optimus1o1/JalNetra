import { NextRequest, NextResponse } from "next/server";
import { InterventionOption } from "@/lib/domain/types";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";

export const MUNICIPAL_INTERVENTIONS: InterventionOption[] = [
  {
    id: "intv-01-sskm-cistern",
    siteId: "site-w071-sskm",
    name: "SSKM Hospital 200kL Modular Under-Deck Cistern & First-Flush Battery",
    type: "ROOFTOP_CISTERN",
    designCapacityL: 200_000,
    estimatedCostINR: 2_450_000,
    annualHarvestPotentialML: 18.5,
    annualRunoffAvoidedML: 16.2,
    priorityScore: 94,
    implementationTimelineWeeks: 6,
    status: "APPROVED",
    owner: "KMC Borough IX & Health Dept",
  },
  {
    id: "intv-02-tiljala-bioswale",
    siteId: "site-w066-tiljala",
    name: "Tiljala Bus Depot Perimeter Bioswale & Retention Trench",
    type: "BIO_RETENTION_BIOSWALE",
    designCapacityL: 85_000,
    estimatedCostINR: 1_120_000,
    annualHarvestPotentialML: 7.8,
    annualRunoffAvoidedML: 8.4,
    priorityScore: 89,
    implementationTimelineWeeks: 4,
    status: "IN_PROGRESS",
    owner: "KMC Civil Engineering / Drainage",
  },
  {
    id: "intv-03-jadavpur-recharge",
    siteId: "site-w093-jadavpur",
    name: "Jadavpur Campus Dual Infiltration Recharge Shaft Array (4 Units)",
    type: "INFILTRATION_RECHARGE_SHAFT",
    designCapacityL: 120_000,
    estimatedCostINR: 1_850_000,
    annualHarvestPotentialML: 14.2,
    annualRunoffAvoidedML: 12.8,
    priorityScore: 92,
    implementationTimelineWeeks: 5,
    status: "PROPOSED",
    owner: "Jadavpur University & State Water Resources",
  },
  {
    id: "intv-04-calcutta-med-plazas",
    siteId: "site-w040-calcutta-med",
    name: "College Street Hospital Quadrangle Permeable Pavement & Sump",
    type: "PERMEABLE_PAVEMENT_RETROFIT",
    designCapacityL: 95_000,
    estimatedCostINR: 1_680_000,
    annualHarvestPotentialML: 10.6,
    annualRunoffAvoidedML: 11.4,
    priorityScore: 86,
    implementationTimelineWeeks: 8,
    status: "ASSESSED",
    owner: "Heritage Conservation & KMC Ward 40",
  },
  {
    id: "intv-05-behala-depot",
    siteId: "site-w131-behala",
    name: "Taratala Freight Depot 150kL Community Dewatering & Reuse Sump",
    type: "COMMUNITY_STORAGE_SUMP",
    designCapacityL: 150_000,
    estimatedCostINR: 2_100_000,
    annualHarvestPotentialML: 15.4,
    annualRunoffAvoidedML: 14.1,
    priorityScore: 88,
    implementationTimelineWeeks: 7,
    status: "PROPOSED",
    owner: "KMC Borough XIV Works",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  let list = MUNICIPAL_INTERVENTIONS;
  if (statusParam) {
    list = list.filter((i) => i.status.toLowerCase() === statusParam.toLowerCase());
  }

  const totalCost = list.reduce((sum, i) => sum + i.estimatedCostINR, 0);
  const totalAnnualHarvestML = list.reduce((sum, i) => sum + i.annualHarvestPotentialML, 0);
  const totalAnnualRunoffAvoidedML = list.reduce((sum, i) => sum + i.annualRunoffAvoidedML, 0);

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
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
