import { NextRequest, NextResponse } from "next/server";
import { getRecentAuditLogs } from "@/lib/security/auditLog";
import { checkDatabaseHealth } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 20)) : 20;

  const logs = getRecentAuditLogs(limit);
  const dbHealth = await checkDatabaseHealth();

  return NextResponse.json({
    status: "success",
    operationalMode: dbHealth.operationalMode,
    dbHealth,
    count: logs.length,
    timestamp: new Date().toISOString(),
    logs,
  });
}
