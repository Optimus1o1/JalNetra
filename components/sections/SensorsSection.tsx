"use client";

import React, { useState } from "react";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";
import { SensorNode, SensorType } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface SensorsSectionProps {
  onNavigateToPlanner?: () => void;
}

export function SensorsSection({ onNavigateToPlanner }: SensorsSectionProps) {
  const [sensors, setSensors] = useState<SensorNode[]>(IOT_SENSOR_NODES);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedSensor, setSelectedSensor] = useState<SensorNode>(IOT_SENSOR_NODES[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const filteredSensors = sensors.filter((s) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "rainwater_tank") return s.type === "rainwater_tank";
    if (activeFilter === "drainage") return s.type === "stormwater_sump" || s.type === "canal_flow" || s.type === "sluice_gate";
    if (activeFilter === "groundwater") return s.type === "groundwater_piezometer";
    if (activeFilter === "weather") return s.type === "weather_station";
    return true;
  });

  const rwhTanks = sensors.filter((s) => s.type === "rainwater_tank");
  const totalCapacityL = rwhTanks.reduce((sum, s) => sum + (s.tankCapacityL || 0), 0);
  const totalCurrentStorageL = rwhTanks.reduce((sum, s) => sum + (s.currentStorageL || 0), 0);
  const totalAvailableCapacityL = rwhTanks.reduce((sum, s) => sum + (s.availableCapacityL || 0), 0);
  const aggregateHeadroomPct = totalCapacityL > 0 ? Math.round((totalAvailableCapacityL / totalCapacityL) * 100) : 0;

  // Telemetry Ping Simulation
  const handleSimulateTelemetryPing = async (sensor: SensorNode) => {
    setIsSimulating(true);
    setSimulationStatus("Transmitting edge telemetry payload...");
    try {
      const isTank = sensor.type === "rainwater_tank";
      const payload = isTank
        ? {
            sensorId: sensor.id,
            metric: "tankLevelM",
            value: Math.max(0.5, Math.min(4.0, (sensor.tankLevelM || 2.0) + (Math.random() * 0.4 - 0.2))),
            unit: "m",
            batteryPct: Math.max(10, sensor.batteryPct - 1),
          }
        : {
            sensorId: sensor.id,
            metric: "waterLevelM",
            value: Math.max(0.5, Math.min(8.0, sensor.waterLevelM + (Math.random() * 0.2 - 0.1))),
            unit: "m",
            batteryPct: Math.max(10, sensor.batteryPct - 1),
          };

      const res = await fetch("/api/v1/sensors/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationStatus(`QC Passed: ${data.receiptId}`);
        // Update local state
        setSensors((prev) =>
          prev.map((s) => {
            if (s.id === sensor.id) {
              const updated = { ...s, lastPing: "Just now (Edge Ingested)" };
              if (isTank && payload.value) {
                updated.tankLevelM = Number(payload.value.toFixed(2));
                const capacity = updated.tankCapacityL || 300000;
                const fullPct = Math.min(1.0, updated.tankLevelM / 4.0);
                updated.currentStorageL = Math.round(capacity * fullPct);
                updated.availableCapacityL = capacity - updated.currentStorageL;
              }
              return updated;
            }
            return s;
          })
        );
      } else {
        const err = await res.json();
        setSimulationStatus(`QC Error: ${err.error || "Failed"}`);
      }
    } catch {
      setSimulationStatus("Simulated local ping (Server offline fallback)");
    } finally {
      setIsSimulating(false);
      setTimeout(() => setSimulationStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard tone="elevated" className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                IoT Sensor Telemetry & Storage Digital Fleet
              </h1>
              <Badge variant="cyan">EDGE TELEMETRY</Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Live multi-modal sensory grid across Kolkata: Rainwater Cisterns, Pumping Sumps, Piezometers, and AWS Rain Gauges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPlanner && (
              <Button
                variant="glass"
                size="sm"
                onClick={onNavigateToPlanner}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs font-mono"
              >
                Municipal Planner →
              </Button>
            )}
          </div>
        </div>

        {/* Global Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Monitored Fleet</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{sensors.length} Nodes</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
              <span>●</span> {sensors.filter((s) => s.status === "online").length} Online / {sensors.filter((s) => s.status === "warning").length} Alert
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">RWH Cistern Capacity</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {(totalCapacityL / 1000).toLocaleString()} kL
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {rwhTanks.length} institutional tanks
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Current Stored Water</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {(totalCurrentStorageL / 1000).toLocaleString()} kL
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {100 - aggregateHeadroomPct}% average fill
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Available Headroom</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {(totalAvailableCapacityL / 1000).toLocaleString()} kL
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
              {aggregateHeadroomPct}% storm absorption headroom
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "all", label: "All Nodes" },
          { id: "rainwater_tank", label: "Rainwater Cisterns & Tanks" },
          { id: "drainage", label: "Canals & Drainage Sumps" },
          { id: "groundwater", label: "Deep Aquifer Piezometers" },
          { id: "weather", label: "Automated Weather Stations" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
              activeFilter === tab.id
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Sensor Cards and Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor List (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredSensors.map((node) => {
            const isSelected = selectedSensor.id === node.id;
            const isTank = node.type === "rainwater_tank";
            const fillPct = isTank && node.tankCapacityL && node.currentStorageL
              ? Math.round((node.currentStorageL / node.tankCapacityL) * 100)
              : null;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedSensor(node)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/20"
                    : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          node.status === "online"
                            ? "bg-emerald-400"
                            : node.status === "warning"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      />
                      <h4 className="text-sm font-semibold text-white font-sans">{node.name}</h4>
                      <Badge
                        variant={
                          node.type === "rainwater_tank"
                            ? "cyan"
                            : node.type === "groundwater_piezometer"
                            ? "purple"
                            : node.type === "weather_station"
                            ? "emerald"
                            : "slate"
                        }
                      >
                        {node.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-2">
                      <span>Station: {node.stationCode}</span>
                      <span>•</span>
                      <span>Coords: {node.coordinates[0].toFixed(3)}°N, {node.coordinates[1].toFixed(3)}°E</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">{node.lastPing}</span>
                    <span className="text-[10px] font-mono text-cyan-400">Battery: {node.batteryPct}%</span>
                  </div>
                </div>

                {/* Specific Metrics Row */}
                {isTank ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/70">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Water Level</span>
                      <span className="text-xs font-mono font-bold text-white">{node.tankLevelM ?? node.waterLevelM} m</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Current Storage</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {((node.currentStorageL || 0) / 1000).toLocaleString()} kL ({fillPct}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Storm Headroom</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {((node.availableCapacityL || 0) / 1000).toLocaleString()} kL
                      </span>
                    </div>
                  </div>
                ) : node.type === "groundwater_piezometer" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/70">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Aquifer Water Table Depth</span>
                      <span className="text-xs font-mono font-bold text-purple-400">{node.waterLevelM} m bgl</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Water Quality (Turbidity)</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{node.turbidityNtu} NTU</span>
                    </div>
                  </div>
                ) : node.type === "weather_station" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/70">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Precipitation Nowcast</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{node.rainfallMm ?? 24.5} mm/hr</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Barometric Sensor</span>
                      <span className="text-xs font-mono font-bold text-slate-300">1008.2 hPa (Falling)</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/70">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Stage / Depth</span>
                      <span className="text-xs font-mono font-bold text-white">{node.waterLevelM} m</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Velocity</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{node.flowVelocityMs} m/s</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Discharge</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{node.dischargeCusecs} cusecs</span>
                    </div>
                  </div>
                )}

                {node.anomalyDetected && node.anomalyMessage && (
                  <div className="mt-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300">
                    ⚠️ {node.anomalyMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Sensor Detailed Inspector Card */}
        <div className="space-y-4">
          <GlassCard tone="elevated" className="p-5 bg-slate-900/80 border-slate-800 sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Node Telemetry Inspector</span>
              <Badge variant={selectedSensor.status === "online" ? "emerald" : "amber"}>
                {selectedSensor.status.toUpperCase()}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white font-sans">{selectedSensor.name}</h3>
                <span className="text-xs font-mono text-slate-400">{selectedSensor.stationCode}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensor Class</span>
                  <span className="text-white capitalize">{selectedSensor.type.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location GPS</span>
                  <span className="text-cyan-400">
                    {selectedSensor.coordinates[0].toFixed(4)}, {selectedSensor.coordinates[1].toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Level</span>
                  <span className="text-emerald-400">{selectedSensor.batteryPct}% LiFePO4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transmission</span>
                  <span className="text-slate-300">NB-IoT / LoRaWAN Class C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Provenance Flag</span>
                  <span className="text-emerald-400">MEASURED_EDGE_QC</span>
                </div>
              </div>

              {/* Tank Specific Breakdown */}
              {selectedSensor.type === "rainwater_tank" && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Cistern Level Profile</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>Cistern Fill Level</span>
                      <span>
                        {Math.round(
                          ((selectedSensor.currentStorageL || 0) / (selectedSensor.tankCapacityL || 1)) * 100
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((selectedSensor.currentStorageL || 0) / (selectedSensor.tankCapacityL || 1)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Capacity: {((selectedSensor.tankCapacityL || 0) / 1000).toLocaleString()} kL</span>
                    <span>Free: {((selectedSensor.availableCapacityL || 0) / 1000).toLocaleString()} kL</span>
                  </div>
                </div>
              )}

              {/* Edge Ping Action */}
              <div className="pt-3 border-t border-slate-800">
                <Button
                  onClick={() => handleSimulateTelemetryPing(selectedSensor)}
                  disabled={isSimulating}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs"
                >
                  {isSimulating ? "Transmitting..." : "Send Simulated Edge Telemetry"}
                </Button>
                {simulationStatus && (
                  <p className="text-[11px] font-mono text-cyan-400 text-center mt-2 animate-pulse">
                    {simulationStatus}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
