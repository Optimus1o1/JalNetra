import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

export type OperationalMode = "DATABASE_MODE" | "FALLBACK_MODE";

export interface DatabaseHealthStatus {
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  operationalMode: OperationalMode;
  latencyMs: number;
  postgisVersion?: string;
  database?: string;
  error?: string;
  checkedAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pgPoolGlobal: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var dbHealthCache: { status: DatabaseHealthStatus; expiresAt: number } | undefined;
}

function createPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    const pool = new pg.Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.warn("[JalNetra DB Pool] Unexpected error on idle client:", err.message);
    });

    return pool;
  } catch (err) {
    console.warn("[JalNetra DB Pool] Failed to create connection pool:", err);
    return null;
  }
}

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (global.prismaGlobal) {
    return global.prismaGlobal;
  }

  try {
    if (!global.pgPoolGlobal) {
      global.pgPoolGlobal = createPool() || undefined;
    }
    if (!global.pgPoolGlobal) {
      return null;
    }

    const adapter = new PrismaPg(global.pgPoolGlobal);
    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    // In both production and development, cache client on global/module scope
    global.prismaGlobal = client;
    return client;
  } catch (err) {
    console.warn(
      "[JalNetra DB] Database client initialization failed. Operating in FALLBACK_MODE with calibrated in-memory digital twin models.",
      err
    );
    return null;
  }
}

export const isDatabaseConnected = (): boolean => {
  return Boolean(process.env.DATABASE_URL && getPrismaClient() !== null);
};

export async function checkDatabaseHealth(forceCheck = false): Promise<DatabaseHealthStatus> {
  const now = Date.now();
  if (!forceCheck && global.dbHealthCache && global.dbHealthCache.expiresAt > now) {
    return global.dbHealthCache.status;
  }

  if (!process.env.DATABASE_URL) {
    const offlineStatus: DatabaseHealthStatus = {
      status: "OFFLINE",
      operationalMode: "FALLBACK_MODE",
      latencyMs: 0,
      error: "DATABASE_URL not configured",
      checkedAt: new Date().toISOString(),
    };
    global.dbHealthCache = { status: offlineStatus, expiresAt: now + 10000 };
    return offlineStatus;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    const degradedStatus: DatabaseHealthStatus = {
      status: "DEGRADED",
      operationalMode: "FALLBACK_MODE",
      latencyMs: 0,
      error: "Prisma client could not connect to PostgreSQL",
      checkedAt: new Date().toISOString(),
    };
    global.dbHealthCache = { status: degradedStatus, expiresAt: now + 5000 };
    return degradedStatus;
  }

  try {
    const t0 = performance.now();
    const rows = await prisma.$queryRaw<Array<{ live: number; postgis?: string; db?: string }>>`
      SELECT 1 as live, postgis_version() as postgis, current_database() as db;
    `;
    const latencyMs = Number((performance.now() - t0).toFixed(2));

    const healthyStatus: DatabaseHealthStatus = {
      status: "HEALTHY",
      operationalMode: "DATABASE_MODE",
      latencyMs,
      postgisVersion: rows[0]?.postgis || "UNKNOWN",
      database: rows[0]?.db || "postgres",
      checkedAt: new Date().toISOString(),
    };
    global.dbHealthCache = { status: healthyStatus, expiresAt: now + 10000 };
    return healthyStatus;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const failedStatus: DatabaseHealthStatus = {
      status: "DEGRADED",
      operationalMode: "FALLBACK_MODE",
      latencyMs: 0,
      error: errMsg,
      checkedAt: new Date().toISOString(),
    };
    global.dbHealthCache = { status: failedStatus, expiresAt: now + 5000 };
    return failedStatus;
  }
}

export async function getOperationalMode(): Promise<OperationalMode> {
  const health = await checkDatabaseHealth();
  return health.operationalMode;
}
