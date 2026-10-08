import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: pg.Pool };

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/jalnetra_twin?schema=public';

// Initialize PG connection pool with resilient options
const pool =
  globalForPrisma.pool ||
  new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Robust database connectivity and health probe.
 * Checks PostgreSQL connection and PostGIS extension status.
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  postgisInstalled: boolean;
  postgisVersion?: string;
  database?: string;
  error?: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();
  try {
    const res = await pool.query(`
      SELECT 
        1 as live,
        postgis_version() as postgis_ver,
        current_database() as db_name
    `);
    const latencyMs = Date.now() - startTime;
    const row = res.rows[0];
    return {
      connected: true,
      postgisInstalled: !!row.postgis_ver,
      postgisVersion: row.postgis_ver || undefined,
      database: row.db_name,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      postgisInstalled: false,
      error: message,
      latencyMs,
    };
  }
}

export default prisma;
