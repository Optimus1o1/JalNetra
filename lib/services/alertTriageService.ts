import { AlertEvent } from "../data/alertsData";

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
  const isCritical = alert.severity === "critical";
  const isHighTideLock = alert.title.toLowerCase().includes("tide") || alert.title.toLowerCase().includes("lock");
  const isStormWater = alert.title.toLowerCase().includes("pumping") || alert.title.toLowerCase().includes("inundation");

  if (isCritical && isHighTideLock) {
    return {
      alertId: alert.id,
      urgencyLevel: "CRITICAL_IMMEDIATE",
      primaryTrigger: "Tidal Surge Lockup Over British-Era Outfalls (Palmer's Bridge / Ballygunge)",
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
