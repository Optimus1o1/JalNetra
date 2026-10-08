import { getPgPool, OperationalMode } from "../db";
import { CatchmentSite, SiteType, RechargeSuitabilityClass } from "../domain/types";
import { KMC_CATCHMENT_SITES } from "../data/rainwaterSitesData";

export interface CatchmentSitesRepoResult {
  sites: CatchmentSite[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export interface CatchmentSiteRepoSingleResult {
  site: CatchmentSite | null;
  operationalMode: OperationalMode;
  fromDb: boolean;
}

function mapRowToCatchmentSite(row: any): CatchmentSite {
  return {
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
  };
}

const SELECT_FIELDS = `
  site_key, ward_number, ward_name, borough, site_name, site_type, latitude, longitude,
  roof_area_sq_m, open_ground_area_sq_m, total_catchment_area_sq_m, runoff_coefficient,
  collection_efficiency, existing_tank_capacity_l, current_tank_storage_l,
  daily_non_potable_demand_l, soil_infiltration_rate_mm_hr, depth_to_water_table_m,
  recharge_suitability, provenance
`;

export async function getAllSites(options?: { limit?: number; offset?: number }): Promise<CatchmentSitesRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const limit = Math.max(1, Math.min(options?.limit ?? 100, 500));
      const offset = Math.max(0, options?.offset ?? 0);
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM catchment_sites
        ORDER BY ward_number ASC, site_name ASC
        LIMIT $1 OFFSET $2
      `;
      const res = await pool.query(query, [limit, offset]);
      if (res.rows && res.rows.length > 0) {
        return {
          sites: res.rows.map(mapRowToCatchmentSite),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[CatchmentSiteRepository] DB query failed, falling back:", err);
    }
  }

  return {
    sites: KMC_CATCHMENT_SITES,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getSiteById(siteKey: string): Promise<CatchmentSiteRepoSingleResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM catchment_sites
        WHERE site_key = $1
        LIMIT 1
      `;
      const res = await pool.query(query, [siteKey]);
      if (res.rows && res.rows.length > 0) {
        return {
          site: mapRowToCatchmentSite(res.rows[0]),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn(`[CatchmentSiteRepository] DB query failed for siteKey ${siteKey}:`, err);
    }
  }

  const fallback = KMC_CATCHMENT_SITES.find((s) => s.id === siteKey) || null;
  return {
    site: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getSitesByWard(wardNumber: number): Promise<CatchmentSitesRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM catchment_sites
        WHERE ward_number = $1
        ORDER BY site_name ASC
      `;
      const res = await pool.query(query, [wardNumber]);
      if (res.rows && res.rows.length > 0) {
        return {
          sites: res.rows.map(mapRowToCatchmentSite),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn(`[CatchmentSiteRepository] DB query failed for ward ${wardNumber}:`, err);
    }
  }

  const fallback = KMC_CATCHMENT_SITES.filter((s) => s.wardNumber === wardNumber);
  return {
    sites: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

/**
 * Spatial Viewport Filter using PostGIS Bounding Box operator (&& ST_MakeEnvelope)
 */
export async function getSitesByViewport(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Promise<CatchmentSitesRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM catchment_sites
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY ward_number ASC, site_name ASC
      `;
      // Envelope format: (minX, minY, maxX, maxY) -> (minLng, minLat, maxLng, maxLat)
      const res = await pool.query(query, [minLng, minLat, maxLng, maxLat]);
      if (res.rows && res.rows.length > 0) {
        return {
          sites: res.rows.map(mapRowToCatchmentSite),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[CatchmentSiteRepository] PostGIS viewport query failed, falling back:", err);
    }
  }

  // Memory fallback filtering
  const fallback = KMC_CATCHMENT_SITES.filter((s) => {
    const [lat, lng] = s.coordinates;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  });

  return {
    sites: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

/**
 * Spatial Proximity Buffer using PostGIS ST_DWithin
 */
export async function getSitesNearPoint(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<CatchmentSitesRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM catchment_sites
        WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        ORDER BY ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) ASC
      `;
      // Point format: (lng, lat)
      const res = await pool.query(query, [lng, lat, radiusMeters]);
      if (res.rows && res.rows.length > 0) {
        return {
          sites: res.rows.map(mapRowToCatchmentSite),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[CatchmentSiteRepository] PostGIS proximity query failed, falling back:", err);
    }
  }

  // Fallback: Haversine distance in memory
  const fallback = KMC_CATCHMENT_SITES.filter((s) => {
    const [sLat, sLng] = s.coordinates;
    const dLat = ((sLat - lat) * Math.PI) / 180;
    const dLng = ((sLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) * Math.cos((sLat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = 6371000 * c;
    return distMeters <= radiusMeters;
  });

  return {
    sites: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getRechargeEligibleSites(): Promise<CatchmentSitesRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM catchment_sites
        ORDER BY depth_to_water_table_m DESC, soil_infiltration_rate_mm_hr DESC
      `;
      const res = await pool.query(query);
      if (res.rows && res.rows.length > 0) {
        return {
          sites: res.rows.map(mapRowToCatchmentSite),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[CatchmentSiteRepository] Recharge eligible query failed:", err);
    }
  }

  return {
    sites: KMC_CATCHMENT_SITES,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}
