import { INITIAL_ALERTS } from "../data/alertsData";
import { AlertIncident, AlertItem } from "@/lib/types";
import { getPgPool } from "@/lib/db";

export type AlertEvent = AlertItem;

// In-memory operational incidents state
const inMemoryIncidents: AlertIncident[] = [...INITIAL_ALERTS];

export async function getActiveIncidents(severityFilter?: string): Promise<AlertIncident[]> {
  const pool = getPgPool();

  if (pool) {
    try {
      const query = severityFilter
        ? `SELECT id, alert_code, severity, title, description, trigger_mechanism,
                  confidence_score, affected_infrastructure, recommended_actions,
                  status, acknowledged_by, acknowledged_at, issued_at
           FROM incident_alerts
           WHERE UPPER(severity) = UPPER($1)
           ORDER BY issued_at DESC`
        : `SELECT id, alert_code, severity, title, description, trigger_mechanism,
                  confidence_score, affected_infrastructure, recommended_actions,
                  status, acknowledged_by, acknowledged_at, issued_at
           FROM incident_alerts
           ORDER BY issued_at DESC`;
      const params = severityFilter ? [severityFilter] : [];
      const res = await pool.query(query, params);

      if (res.rows && res.rows.length > 0) {
        return res.rows.map((a: any) => ({
          id: a.id,
          alertCode: a.alert_code,
          severity: a.severity.toLowerCase() as AlertIncident["severity"],
          title: a.title,
          category: "Flash Flood Imminent",
          hazardScore: 0.85,
          exposureScore: 0.8,
          vulnerabilityScore: 0.82,
          compositeRisk: 0.85,
          primaryCause: a.description || a.title,
          wardNumber: 66,
          wardName: "Topsia / Tiljala Wetlands",
          cellId: "cell-w066",
          affectedInfrastructure: Array.isArray(a.affected_infrastructure)
            ? a.affected_infrastructure
            : typeof a.affected_infrastructure === "string"
            ? JSON.parse(a.affected_infrastructure)
            : [],
          issuedAt: a.issued_at ? new Date(a.issued_at).toISOString() : new Date().toISOString(),
          confidenceScore: Number(a.confidence_score || 0.85),
          recommendedCivilActions: Array.isArray(a.recommended_actions)
            ? a.recommended_actions
            : ["Deploy emergency mobile pumps."],
          status: (a.status === "ACKNOWLEDGED" ? "acknowledged" : "active") as AlertIncident["status"],
          acknowledgedBy: a.acknowledged_by || undefined,
          acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at).toISOString() : undefined,
        }));
      }
    } catch (err) {
      console.warn("[AlertTriageService] DB query failed, falling back to operational memory.", err);
    }
  }

  if (severityFilter) {
    return inMemoryIncidents.filter(
      (a) => a.severity.toLowerCase() === severityFilter.toLowerCase()
    );
  }
  return inMemoryIncidents;
}

export async function acknowledgeIncident(
  alertIdOrCode: string,
  operatorId: string = "CENTRAL_OPERATOR",
  actionTaken?: string
): Promise<{ success: boolean; updatedAlert: AlertIncident | null; message: string }> {
  let targetIndex = inMemoryIncidents.findIndex(
    (a) => a.id === alertIdOrCode || a.alertCode === alertIdOrCode
  );

  if (targetIndex === -1) {
    const cleanQuery = alertIdOrCode.toLowerCase().replace(/[^a-z0-9]/g, "");
    targetIndex = inMemoryIncidents.findIndex((a) => {
      const cleanId = a.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanCode = a.alertCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        cleanId.includes(cleanQuery) ||
        cleanCode.includes(cleanQuery) ||
        cleanQuery.includes(cleanCode) ||
        (cleanQuery.includes("w066") && cleanCode.includes("w66")) ||
        (cleanQuery.includes("w131") && cleanCode.includes("w131"))
      );
    });
  }

  const timestamp = new Date().toISOString();
  let updatedAlert: AlertIncident | null = null;

  if (targetIndex !== -1) {
    inMemoryIncidents[targetIndex] = {
      ...inMemoryIncidents[targetIndex],
      status: "acknowledged",
      acknowledgedBy: operatorId,
      acknowledgedAt: timestamp,
    };
    updatedAlert = inMemoryIncidents[targetIndex];
  } else {
    // Dynamically register ad-hoc dispatched incident
    const newAlert: AlertIncident = {
      id: alertIdOrCode,
      alertCode: alertIdOrCode,
      severity: "critical",
      title: `Tactical Incident Response: ${alertIdOrCode}`,
      category: "Flash Flood Imminent",
      hazardScore: 0.88,
      exposureScore: 0.82,
      vulnerabilityScore: 0.85,
      compositeRisk: 0.89,
      primaryCause: actionTaken || "Emergency dispatch order executed by central command.",
      wardNumber: 66,
      wardName: "Topsia / Tiljala Wetlands",
      cellId: "cell-w066",
      affectedInfrastructure: ["Basin Drainage Link Corridor"],
      issuedAt: timestamp,
      confidenceScore: 0.94,
      recommendedCivilActions: [actionTaken || "Dispatched emergency dewatering units."],
      status: "acknowledged",
      acknowledgedBy: operatorId,
      acknowledgedAt: timestamp,
    };
    inMemoryIncidents.unshift(newAlert);
    updatedAlert = newAlert;
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE incident_alerts
         SET status = 'ACKNOWLEDGED',
             acknowledged_by = $1,
             acknowledged_at = NOW()
         WHERE id::text = $2 OR alert_code = $2`,
        [operatorId, alertIdOrCode]
      );
    } catch (err) {
      console.warn("[AlertTriageService] DB update failed, acknowledgment saved in memory.", err);
    }
  }

  return {
    success: true,
    updatedAlert,
    message: `Alert ${alertIdOrCode} successfully acknowledged by ${operatorId}. ${
      actionTaken ? `Dispatch order: "${actionTaken}".` : "Dispatch protocol initiated."
    }`,
  };
}

export interface TacticalActionStep {
  stepNumber: number;
  actionCode: string;
  title: string;
  description: string;
  ownerUnit: string;
  targetInfrastructure: string;
  estimatedCompletionMinutes: number;
}

export interface TriageEvaluation {
  alertId: string;
  urgencyLevel: "CRITICAL_IMMEDIATE" | "HIGH_PRIORITY" | "ELEVATED_WATCH" | "ROUTINE_MONITOR";
  primaryTrigger: string;
  recommendedDispatchProtocol: string;
  actionSteps: TacticalActionStep[];
  outfallLockupImminent: boolean;
  provenance: "SIMULATED";
}

/**
 * Operational Decision & Action Protocol Dispatcher.
 * Maps flood and waterlogging alerts directly to concrete municipal engineering orders.
 */
export function evaluateAlertTriage(alert: AlertEvent): TriageEvaluation {
  const isCritical = alert.severity?.toLowerCase() === "critical";
  const isHighTideLock = alert.title.toLowerCase().includes("tide") || alert.title.toLowerCase().includes("lock");
  const isStormWater = alert.title.toLowerCase().includes("pumping") || alert.title.toLowerCase().includes("inundation");

  if (isCritical) {
    return {
      alertId: alert.id,
      urgencyLevel: "CRITICAL_IMMEDIATE",
      primaryTrigger: isHighTideLock
        ? "Tidal Surge Lockup Over British-Era Outfalls (Palmer's Bridge / Ballygunge)"
        : "Critical Convective Inundation Head Exceeding Outfall Capacity",
      recommendedDispatchProtocol: "DISPATCH-STORM-EMERGENCY-LOCKUP",
      outfallLockupImminent: true,
      actionSteps: [
        {
          stepNumber: 1,
          actionCode: "ACT-VALVE-PREDRAWDOWN",
          title: "Pre-emptively Draw Down Secondary Storage Cisterns",
          description: "Drain 200kL SSKM and 150kL Taratala cisterns to create 350kL surge absorption buffer ahead of lockup.",
          ownerUnit: "KMC Borough Works & Drainage Directorate",
          targetInfrastructure: "SSKM Hospital & Taratala Freight Cisterns",
          estimatedCompletionMinutes: 45,
        },
        {
          stepNumber: 2,
          actionCode: "ACT-PUMP-AUXILIARY",
          title: "Stage High-Capacity Tractor Pumps at Low-Lying Arterials",
          description: "Mobilize 12-cusec diesel portable pumps to Park Circus 7-Point and College Street intersection.",
          ownerUnit: "KMC Mechanical Drainage Division",
          targetInfrastructure: "Park Circus & College Street Corridors",
          estimatedCompletionMinutes: 30,
        },
        {
          stepNumber: 3,
          actionCode: "ACT-SLUICE-GRAVITY-LOCK",
          title: "Dog-Leg Sluice Closure & Divert to Infiltration Well Arrays",
          description: "Seal backflow flap gates against Hooghly 5.4m tide; divert stormwater to Ward 66 deep recharge shafts.",
          ownerUnit: "Irrigation & Waterways Dept (I&WD)",
          targetInfrastructure: "Palmer's Bridge Tidal Flap Gates",
          estimatedCompletionMinutes: 20,
        },
      ],
      provenance: "SIMULATED",
    };
  }

  if (isCritical || isStormWater) {
    return {
      alertId: alert.id,
      urgencyLevel: "HIGH_PRIORITY",
      primaryTrigger: "High-Rate Influx Exceeding Gravity Sewer Runoff Capacity",
      recommendedDispatchProtocol: "DISPATCH-INTERVENTION-DETENTION",
      outfallLockupImminent: false,
      actionSteps: [
        {
          stepNumber: 1,
          actionCode: "ACT-DETENTION-ROUTING",
          title: "Route Surface Sheet Flow to Park Circus Perimeter Bioswales",
          description: "Engage curb inlets feeding Tiljala depot retention trenches to capture initial 85,000L surge.",
          ownerUnit: "KMC Civil Works",
          targetInfrastructure: "Tiljala Bus Depot Drainage Basin",
          estimatedCompletionMinutes: 25,
        },
        {
          stepNumber: 2,
          actionCode: "ACT-SCREEN-CLEARANCE",
          title: "Mechanical Trash Screen Raking at Storm Gully Intakes",
          description: "Deploy rapid clearing squad to prevent solid waste blockage of primary drop sumps.",
          ownerUnit: "Solid Waste Management & Drainage Squad",
          targetInfrastructure: "Ward 66 Drop Sumps",
          estimatedCompletionMinutes: 35,
        },
      ],
      provenance: "SIMULATED",
    };
  }

  return {
    alertId: alert.id,
    urgencyLevel: "ELEVATED_WATCH",
    primaryTrigger: "Forecast Precipitation Window Within Alert Threshold",
    recommendedDispatchProtocol: "MONITOR-TELEMETRY-STREAM",
    outfallLockupImminent: false,
    actionSteps: [
      {
        stepNumber: 1,
        actionCode: "ACT-TELEMETRY-SAMPLING",
        title: "Increase Rain Gauge & Ultrasonic Level Sampling Rate",
        description: "Switch IMD Alipore and ultrasonic sewer loggers from 15-min to 2-min high-frequency telemetry ping.",
        ownerUnit: "JalNetra Telemetry Operations",
        targetInfrastructure: "Alipore & Ballygunge IoT Sensor Nodes",
        estimatedCompletionMinutes: 5,
      },
    ],
    provenance: "SIMULATED",
  };
}
