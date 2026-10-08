import { NextRequest, NextResponse } from "next/server";
import { getActiveIncidents, acknowledgeIncident, evaluateAlertTriage } from "@/lib/services/alertTriageService";
import { sanitizeString } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/auditLog";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");

  const alerts = await getActiveIncidents(severity && severity !== "all" ? severity : undefined);
  const formattedAlerts = alerts.map((a) => ({
    ...a,
    severity: (a.severity || "info").toUpperCase(),
  }));

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    totalAlerts: formattedAlerts.length,
    activeCount: formattedAlerts.filter((a) => a.status === "active").length,
    acknowledgedCount: formattedAlerts.filter((a) => a.status === "acknowledged").length,
    alerts: formattedAlerts,
  });
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

    const body = await request.json();
    const alertId = sanitizeString(body.alertId, 64);
    const operatorName = sanitizeString(body.operatorName || body.operatorNotes, 120, "KMC Central Command Operator");
    const actionTaken = sanitizeString(body.actionTaken || body.action, 500, "Dispatched emergency civil protocol");

    if (!alertId) {
      return NextResponse.json({ error: "Missing alertId parameter" }, { status: 400 });
    }

    const { success, updatedAlert, message } = await acknowledgeIncident(
      alertId,
      operatorName,
      actionTaken
    );

    if (!success || !updatedAlert) {
      return NextResponse.json({ error: "Alert not found or failed to update" }, { status: 404 });
    }

    logAuditEvent(
      "ALERT_ACKNOWLEDGED",
      operatorName,
      ip,
      `Incident alert [${alertId}] acknowledged: ${actionTaken}`,
      "INFO"
    );

    const triage = evaluateAlertTriage(updatedAlert);

    return NextResponse.json({
      status: "acknowledged",
      alertId,
      message,
      updatedAlert,
      triage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request payload", details: String(err) },
      { status: 400 }
    );
  }
}
