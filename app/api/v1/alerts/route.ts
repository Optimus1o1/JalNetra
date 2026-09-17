import { NextRequest, NextResponse } from "next/server";
import { INITIAL_ALERTS } from "@/lib/data/alertsData";

// In-memory mutable alerts registry for real-time demonstration
let alertsRegistry = [...INITIAL_ALERTS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");

  let filtered = alertsRegistry;
  if (severity && severity !== "all") {
    filtered = alertsRegistry.filter((a) => a.severity === severity);
  }

  return NextResponse.json({
    status: "success",
    timestamp: new Date().toISOString(),
    totalAlerts: alertsRegistry.length,
    activeCount: alertsRegistry.filter((a) => a.status === "active").length,
    acknowledgedCount: alertsRegistry.filter((a) => a.status === "acknowledged").length,
    alerts: filtered,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, operatorName } = body;

    if (!alertId) {
      return NextResponse.json({ error: "Missing alertId parameter" }, { status: 400 });
    }

    const alertIndex = alertsRegistry.findIndex((a) => a.id === alertId);
    if (alertIndex === -1) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    alertsRegistry[alertIndex] = {
      ...alertsRegistry[alertIndex],
      status: "acknowledged",
      acknowledgedBy: operatorName || "KMC Central Command Operator",
      acknowledgedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST",
    };

    return NextResponse.json({
      status: "success",
      message: `Alert ${alertId} acknowledged successfully.`,
      updatedAlert: alertsRegistry[alertIndex],
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request payload", details: String(err) }, { status: 400 });
  }
}
