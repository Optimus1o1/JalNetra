import { getPrismaClient, isDatabaseConnected } from "../lib/db";
import { PILOT_GRID_CELLS } from "../lib/data/pilotRegionData";
import { IOT_SENSOR_NODES } from "../lib/data/sensorNodesData";
import { INITIAL_ALERTS } from "../lib/data/alertsData";
import { MODEL_REGISTRY } from "../lib/data/modelsData";

export async function main() {
  console.log("[JalNetra Seed] Initializing database seeding sequence...");

  if (!isDatabaseConnected()) {
    console.warn(
      "[JalNetra Seed] DATABASE_URL is not configured or PostgreSQL instance is unavailable.\n" +
        "Operating with resilient calibrated in-memory operational twin store.\n" +
        "To seed PostgreSQL, configure DATABASE_URL in your environment."
    );
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    console.warn("[JalNetra Seed] Prisma client could not be instantiated.");
    return;
  }

  // 1. Seed Wards
  console.log(`[JalNetra Seed] Seeding ${PILOT_GRID_CELLS.length} pilot ward zones...`);
  for (const cell of PILOT_GRID_CELLS) {
    const population = Math.round(cell.populationDensity * 2.4);
    const criticalInfra = [
      ...cell.criticalAssets.hospitals,
      ...cell.criticalAssets.pumpingStations,
      ...cell.criticalAssets.transitCorridors,
    ];

    await prisma.ward.upsert({
      where: { wardNumber: cell.wardNumber },
      update: {
        wardName: cell.wardName,
        borough: cell.borough,
        elevationBaselineM: cell.elevation,
        imperviousnessPct: cell.imperviousness,
        population,
        criticalInfrastructure: criticalInfra,
      },
      create: {
        wardNumber: cell.wardNumber,
        wardName: cell.wardName,
        borough: cell.borough,
        areaSqKm: 2.4,
        population,
        elevationBaselineM: cell.elevation,
        imperviousnessPct: cell.imperviousness,
        baseDrainageCapacityCumec: cell.drainageCapacity,
        criticalInfrastructure: criticalInfra,
      },
    });
  }

  // 2. Seed Sensor Fleet
  console.log(`[JalNetra Seed] Seeding ${IOT_SENSOR_NODES.length} telemetry sensor nodes...`);
  for (const node of IOT_SENSOR_NODES) {
    const dischargeCumec = Number((node.dischargeCusecs * 0.0283168).toFixed(2));
    await prisma.sensorNode.upsert({
      where: { nodeKey: node.id },
      update: {
        name: node.name,
        type: node.type,
        latitude: node.coordinates[0],
        longitude: node.coordinates[1],
        status: node.status === "online" ? "ONLINE" : node.status === "warning" ? "WARN" : "OFFLINE",
        batteryPct: node.batteryPct,
        lastWaterLevelM: node.waterLevelM,
        lastDischargeCumec: dischargeCumec,
      },
      create: {
        nodeKey: node.id,
        name: node.name,
        type: node.type,
        latitude: node.coordinates[0],
        longitude: node.coordinates[1],
        elevationM: 3.4,
        status: node.status === "online" ? "ONLINE" : node.status === "warning" ? "WARN" : "OFFLINE",
        batteryPct: node.batteryPct,
        lastWaterLevelM: node.waterLevelM,
        lastDischargeCumec: dischargeCumec,
      },
    });
  }

  // 3. Seed Tidal Stage
  console.log("[JalNetra Seed] Seeding Outram Ghat tidal dynamics...");
  await prisma.hooghlyTideRecord.create({
    data: {
      stationName: "Outram Ghat (Hooghly Estuary)",
      stageMmsl: 5.42,
      tideType: "SPRING",
      sluiceInterlockActive: true,
      minutesToHighTide: 160,
      surgeAnomalyM: 0.45,
    },
  });

  // 4. Seed Incident Alerts
  console.log(`[JalNetra Seed] Seeding ${INITIAL_ALERTS.length} incident triage alerts...`);
  for (const alert of INITIAL_ALERTS) {
    await prisma.incidentAlert.upsert({
      where: { alertCode: alert.alertCode },
      update: {
        title: alert.title,
        severity: alert.severity.toUpperCase(),
        description: alert.primaryCause,
        status: alert.status.toUpperCase(),
      },
      create: {
        alertCode: alert.alertCode,
        severity: alert.severity.toUpperCase(),
        title: alert.title,
        description: alert.primaryCause,
        triggerMechanism: "Compound Surge & Rainfall Confluence",
        confidenceScore: alert.confidenceScore,
        affectedInfrastructure: alert.affectedInfrastructure,
        recommendedActions: alert.recommendedCivilActions,
        status: alert.status.toUpperCase(),
      },
    });
  }

  // 5. Seed Model Records
  console.log(`[JalNetra Seed] Seeding ${MODEL_REGISTRY.length} registered ML models...`);
  for (const m of MODEL_REGISTRY) {
    await prisma.modelRecord.upsert({
      where: { modelKey: m.id },
      update: {
        modelName: m.name,
        version: m.version,
        brierScore: m.metrics.brierScore,
        crps: m.metrics.crpsScore,
        spatialIou: m.metrics.spatialIoU,
      },
      create: {
        modelKey: m.id,
        modelName: m.name,
        version: m.version,
        architecture: m.type,
        brierScore: m.metrics.brierScore,
        crps: m.metrics.crpsScore,
        spatialIou: m.metrics.spatialIoU,
        freshnessMin: 15,
        parameters: "14.2M",
        inferenceLatencyMs: m.metrics.latencyMs,
      },
    });
  }

  console.log("[JalNetra Seed] Database seeding sequence completed successfully.");
}

main().catch((e) => {
  console.error("[JalNetra Seed] Unhandled exception during seeding:", e);
});
