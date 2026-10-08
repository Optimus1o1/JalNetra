import { getPgPool, OperationalMode } from "@/lib/db";
import { CatchmentSite, InterventionOption, SiteType, RechargeSuitabilityClass } from "@/lib/domain/types";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { MUNICIPAL_INTERVENTIONS } from "@/app/api/v1/interventions/route";

export interface CatchmentSitesResult {
  sites: CatchmentSite[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export interface InterventionsResult {
  interventions: InterventionOption[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export async function fetchCatchmentSites(wardNumber?: number | null): Promise<CatchmentSitesResult> {
  const pool = getPgPool();

  if (pool) {
    try {
      const query = wardNumber
        ? `SELECT site_key, ward_number, ward_name, borough, site_name, site_type, latitude, longitude,
                  roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m, runoff_coefficient,
                  collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
                  daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
                  recharge_suitability, provenance
           FROM catchment_sites
           WHERE ward_number = $1
           ORDER BY ward_number ASC, site_name ASC`
        : `SELECT site_key, ward_number, ward_name, borough, site_name, site_type, latitude, longitude,
                  roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m, runoff_coefficient,
                  collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
                  daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
                  recharge_suitability, provenance
           FROM catchment_sites
           ORDER BY ward_number ASC, site_name ASC`;
      const params = wardNumber ? [wardNumber] : [];
      const res = await pool.query(query, params);

      if (res.rows && res.rows.length > 0) {
        const sites: CatchmentSite[] = res.rows.map((row) => ({
          id: row.site_key,
          wardNumber: Number(row.ward_number),
          wardName: row.ward_name,
          borough: row.borough,
          siteName: row.site_name,
          siteType: row.site_type as SiteType,
          coordinates: [Number(row.latitude), Number(row.longitude)],
          roofAreaSqM: Number(row.roof_area_sq_m),
          openGroundAreaSqM: Number(row.open_ground_area_sq_m),
          totalCatchmentAreaSqM: Number(row.total_catchment_area_sq_m),
          runoffCoefficient: Number(row.runoff_coefficient),
          collectionEfficiency: Number(row.collection_efficiency),
          existingTankCapacityL: Number(row.existing_tank_capacity_l),
          currentTankStorageL: Number(row.current_tank_storage_l),
          dailyNonPotableDemandL: Number(row.daily_non_potable_demand_l),
          soilInfiltrationRateMmHr: Number(row.soil_infiltration_rate_mm_hr),
          depthToWaterTableM: Number(row.depth_to_water_table_m),
          rechargeSuitability: row.recharge_suitability as RechargeSuitabilityClass,
          provenance: (typeof row.provenance === "string" ? JSON.parse(row.provenance) : row.provenance) || {
            area: "MEASURED",
            runoffCoeff: "ASSUMED",
            demand: "SIMULATED",
          },
        }));

        return {
          sites,
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[JalNetra Data] CatchmentSite DB query failed, falling back to calibrated in-memory twin store:", err);
    }
  }

  // Resilient fallback
  const fallback = wardNumber
    ? KMC_CATCHMENT_SITES.filter((s) => s.wardNumber === wardNumber)
    : KMC_CATCHMENT_SITES;

  return {
    sites: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function fetchInterventions(statusFilter?: string | null): Promise<InterventionsResult> {
  const pool = getPgPool();

  if (pool) {
    try {
      const query = statusFilter
        ? `SELECT intervention_key, site_id, name, type, design_capacity_l, estimated_cost_inr,
                  annual_harvest_potential_ml, annual_runoff_avoided_ml, priority_score,
                  implementation_timeline_weeks, status, owner, provenance
           FROM intervention_options
           WHERE UPPER(status) = UPPER($1)
           ORDER BY priority_score DESC`
        : `SELECT intervention_key, site_id, name, type, design_capacity_l, estimated_cost_inr,
                  annual_harvest_potential_ml, annual_runoff_avoided_ml, priority_score,
                  implementation_timeline_weeks, status, owner, provenance
           FROM intervention_options
           ORDER BY priority_score DESC`;
      const params = statusFilter ? [statusFilter] : [];
      const res = await pool.query(query, params);

      if (res.rows && res.rows.length > 0) {
        const interventions: InterventionOption[] = res.rows.map((row) => ({
          id: row.intervention_key,
          siteId: row.site_id || "",
          name: row.name,
          type: row.type as any,
          designCapacityL: Number(row.design_capacity_l),
          estimatedCostINR: Number(row.estimated_cost_inr),
          annualHarvestPotentialML: Number(row.annual_harvest_potential_ml),
          annualRunoffAvoidedML: Number(row.annual_runoff_avoided_ml),
          priorityScore: Number(row.priority_score),
          implementationTimelineWeeks: Number(row.implementation_timeline_weeks),
          status: row.status as any,
          owner: row.owner,
        }));

        return {
          interventions,
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[JalNetra Data] InterventionOption DB query failed, falling back to in-memory store:", err);
    }
  }

  // Resilient fallback
  let fallback = MUNICIPAL_INTERVENTIONS;
  if (statusFilter) {
    fallback = fallback.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return {
    interventions: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getPersistedScenarioRecord(scenarioHash: string): Promise<any | null> {
  const pool = getPgPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT results FROM persisted_scenarios WHERE scenario_hash = $1 LIMIT 1`,
      [scenarioHash]
    );
    if (res.rows.length > 0) {
      const raw = res.rows[0].results;
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
  } catch (err) {
    console.warn("[JalNetra Data] PersistedScenario query failed:", err);
  }
  return null;
}

export async function persistScenarioRecord(data: {
  scenarioHash: string;
  scenarioName: string;
  wardNumber: number;
  rainfallEventMm: number;
  calculationVersion: string;
  modelVersion: string;
  inputs: any;
  results: any;
  provenance?: string;
}): Promise<boolean> {
  const pool = getPgPool();
  if (!pool) return false;

  try {
    await pool.query(
      `INSERT INTO persisted_scenarios (
        scenario_hash,
        scenario_name,
        ward_number,
        rainfall_event_mm,
        calculation_version,
        model_version,
        inputs,
        results,
        provenance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (scenario_hash) DO UPDATE SET
        scenario_name = EXCLUDED.scenario_name,
        rainfall_event_mm = EXCLUDED.rainfall_event_mm,
        inputs = EXCLUDED.inputs,
        results = EXCLUDED.results`,
      [
        data.scenarioHash,
        data.scenarioName,
        data.wardNumber,
        data.rainfallEventMm,
        data.calculationVersion,
        data.modelVersion,
        JSON.stringify(data.inputs),
        JSON.stringify(data.results),
        data.provenance || "SIMULATED",
      ]
    );
    return true;
  } catch (err) {
    console.warn("[JalNetra Data] PersistedScenario upsert failed:", err);
    return false;
  }
}

