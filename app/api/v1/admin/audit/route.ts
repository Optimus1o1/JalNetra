import { NextRequest, NextResponse } from "next/server";
import { getRecentAuditLogs } from "@/lib/security/auditLog";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 20)) : 20;

  const logs = getRecentAuditLogs(limit);

  return NextResponse.json({
    status: "success",
    count: logs.length,
    timestamp: new Date().toISOString(),
    logs,
  });
}
