import { getPgPool, OperationalMode } from "../db";
import { InterventionOption, InterventionType, InterventionStatus } from "../domain/types";

export interface InterventionsRepoResult {
  interventions: InterventionOption[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export interface InterventionRepoSingleResult {
  intervention: InterventionOption | null;
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export const FALLBACK_INTERVENTIONS: InterventionOption[] = [
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

function mapRowToIntervention(row: any): InterventionOption {
  return {
    id: row.intervention_key,
    siteId: row.site_id || "",
    name: row.name,
    type: row.type as InterventionType,
    designCapacityL: Number(row.design_capacity_l),
    estimatedCostINR: Number(row.estimated_cost_inr),
    annualHarvestPotentialML: Number(row.annual_harvest_potential_ml),
    annualRunoffAvoidedML: Number(row.annual_runoff_avoided_ml),
    priorityScore: Number(row.priority_score),
    implementationTimelineWeeks: Number(row.implementation_timeline_weeks),
    status: row.status as InterventionStatus,
    owner: row.owner,
  };
}

const SELECT_FIELDS = `
  intervention_key, site_id, name, type, design_capacity_l, estimated_cost_inr,
  annual_harvest_potential_ml, annual_runoff_avoided_ml, priority_score,
  implementation_timeline_weeks, status, owner, provenance
`;

export async function getAllInterventions(statusFilter?: string | null): Promise<InterventionsRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = statusFilter
        ? `SELECT ${SELECT_FIELDS} FROM intervention_options WHERE UPPER(status) = UPPER($1) ORDER BY priority_score DESC`
        : `SELECT ${SELECT_FIELDS} FROM intervention_options ORDER BY priority_score DESC`;
      const params = statusFilter ? [statusFilter] : [];
      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return {
          interventions: res.rows.map(mapRowToIntervention),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[InterventionRepository] DB query failed, falling back:", err);
    }
  }

  let fallback = FALLBACK_INTERVENTIONS;
  if (statusFilter) {
    fallback = fallback.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return {
    interventions: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getInterventionByKey(key: string): Promise<InterventionRepoSingleResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `SELECT ${SELECT_FIELDS} FROM intervention_options WHERE intervention_key = $1 LIMIT 1`;
      const res = await pool.query(query, [key]);
      if (res.rows && res.rows.length > 0) {
        return {
          intervention: mapRowToIntervention(res.rows[0]),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn(`[InterventionRepository] DB query failed for key ${key}:`, err);
    }
  }

  const fallback = FALLBACK_INTERVENTIONS.find((i) => i.id === key) || null;
  return {
    intervention: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getInterventionsBySiteId(siteId: string): Promise<InterventionsRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `SELECT ${SELECT_FIELDS} FROM intervention_options WHERE site_id = $1 ORDER BY priority_score DESC`;
      const res = await pool.query(query, [siteId]);
      if (res.rows && res.rows.length > 0) {
        return {
          interventions: res.rows.map(mapRowToIntervention),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn(`[InterventionRepository] DB query failed for siteId ${siteId}:`, err);
    }
  }

  const fallback = FALLBACK_INTERVENTIONS.filter((i) => i.siteId === siteId);
  return {
    interventions: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}
