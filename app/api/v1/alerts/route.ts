import { NextRequest, NextResponse } from "next/server";
import { getActiveIncidents, acknowledgeIncident } from "@/lib/services/alertTriageService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");

  const alerts = await getActiveIncidents(severity && severity !== "all" ? severity : undefined);

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    totalAlerts: alerts.length,
    activeCount: alerts.filter((a) => a.status === "active").length,
    acknowledgedCount: alerts.filter((a) => a.status === "acknowledged").length,
    alerts,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, operatorName, actionTaken } = body;

    if (!alertId) {
      return NextResponse.json({ error: "Missing alertId parameter" }, { status: 400 });
    }

    const { success, updatedAlert, message } = await acknowledgeIncident(
      alertId,
      operatorName || "KMC Central Command Operator",
      actionTaken
    );

    if (!success || !updatedAlert) {
      return NextResponse.json({ error: "Alert not found or failed to update" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      message,
      updatedAlert,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request payload", details: String(err) },
      { status: 400 }
    );
  }
}
