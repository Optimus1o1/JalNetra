import { getPgPool, OperationalMode } from "../db";
import { PILOT_GRID_CELLS } from "../data/pilotRegionData";
import { GridCell } from "../types";

export interface WardRecord {
  wardNumber: number;
  wardName: string;
  borough: string;
  areaSqKm: number;
  population: number;
  elevationBaselineM: number;
  imperviousnessPct: number;
  baseDrainageCapacityCumec: number;
  criticalInfrastructure?: any[];
  geometry?: any;
}

export interface WardsRepoResult {
  wards: WardRecord[];
  operationalMode: OperationalMode;
  fromDb: boolean;
}

export interface WardRepoSingleResult {
  ward: WardRecord | null;
  operationalMode: OperationalMode;
  fromDb: boolean;
}

function mapRowToWard(row: any): WardRecord {
  return {
    wardNumber: Number(row.ward_number),
    wardName: row.ward_name,
    borough: row.borough,
    areaSqKm: Number(row.area_sq_km),
    population: Number(row.population),
    elevationBaselineM: Number(row.elevation_baseline_m),
    imperviousnessPct: Number(row.imperviousness_pct),
    baseDrainageCapacityCumec: Number(row.base_drainage_capacity_cumec),
    criticalInfrastructure:
      typeof row.critical_infrastructure === "string"
        ? JSON.parse(row.critical_infrastructure)
        : row.critical_infrastructure || [],
    geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry,
  };
}

const SELECT_FIELDS = `
  ward_number, ward_name, borough, area_sq_km, population,
  elevation_baseline_m, imperviousness_pct, base_drainage_capacity_cumec,
  critical_infrastructure, geometry
`;

export async function listWards(): Promise<WardsRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`SELECT ${SELECT_FIELDS} FROM wards ORDER BY ward_number ASC`);
      if (res.rows && res.rows.length > 0) {
        return {
          wards: res.rows.map(mapRowToWard),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[WardRepository] listWards query failed, falling back:", err);
    }
  }

  // Fallback to PILOT_GRID_CELLS
  const fallback = PILOT_GRID_CELLS.map((cell) => ({
    wardNumber: cell.wardNumber,
    wardName: cell.wardName,
    borough: cell.borough,
    areaSqKm: 2.5,
    population: cell.populationDensity * 2.5,
    elevationBaselineM: cell.elevation,
    imperviousnessPct: cell.imperviousness,
    baseDrainageCapacityCumec: cell.drainageCapacity,
  }));

  return {
    wards: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getWardByNumber(wardNumber: number): Promise<WardRepoSingleResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`SELECT ${SELECT_FIELDS} FROM wards WHERE ward_number = $1 LIMIT 1`, [wardNumber]);
      if (res.rows && res.rows.length > 0) {
        return {
          ward: mapRowToWard(res.rows[0]),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn(`[WardRepository] getWardByNumber query failed for ward ${wardNumber}:`, err);
    }
  }

  const candidate = PILOT_GRID_CELLS.find((c) => c.wardNumber === wardNumber);
  const fallback: WardRecord | null = candidate
    ? {
        wardNumber: candidate.wardNumber,
        wardName: candidate.wardName,
        borough: candidate.borough,
        areaSqKm: 2.5,
        population: candidate.populationDensity * 2.5,
        elevationBaselineM: candidate.elevation,
        imperviousnessPct: candidate.imperviousness,
        baseDrainageCapacityCumec: candidate.drainageCapacity,
      }
    : null;

  return {
    ward: fallback,
    operationalMode: "FALLBACK_MODE",
    fromDb: false,
  };
}

export async function getWardsByViewport(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Promise<WardsRepoResult> {
  const pool = getPgPool();
  if (pool) {
    try {
      const query = `
        SELECT ${SELECT_FIELDS}
        FROM wards
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY ward_number ASC
      `;
      const res = await pool.query(query, [minLng, minLat, maxLng, maxLat]);
      if (res.rows && res.rows.length > 0) {
        return {
          wards: res.rows.map(mapRowToWard),
          operationalMode: "DATABASE_MODE",
          fromDb: true,
        };
      }
    } catch (err) {
      console.warn("[WardRepository] PostGIS viewport query failed, falling back:", err);
    }
  }

  return listWards();
}
