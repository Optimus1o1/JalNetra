"use client";

import React, { useState } from "react";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";
import { SensorNode } from "@/lib/types";
import { Waves, Activity, Droplets, Send, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

import { HydraulicSluiceGate3D } from "../3d/HydraulicSluiceGate3D";

export const WaterTwinSection: React.FC = () => {
  const [sensors, setSensors] = useState<SensorNode[]>(IOT_SENSOR_NODES);
  const [ingestionStatus, setIngestionStatus] = useState<string | null>(null);
  const [isSimulatingIngestion, setIsSimulatingIngestion] = useState(false);

  // Quick simulated IoT push to test the /api/v1/sensors/observations endpoint
  const handleSimulateSensorReading = async (sensor: SensorNode) => {
    setIsSimulatingIngestion(true);
    setIngestionStatus(null);

    const updatedLevel = Number((sensor.waterLevelM + (Math.random() * 0.4 - 0.2)).toFixed(2));

    try {
      const res = await fetch("/api/v1/sensors/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensorId: sensor.id,
          timestamp: new Date().toISOString(),
          metric: "waterLevelM",
          value: updatedLevel,
          unit: "meters",
          batteryPct: sensor.batteryPct,
          qualityFlag: "PASSED_BOUNDARY_CHECKS",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIngestionStatus(`Successfully ingested IoT packet: ${data.message}`);
        // Update local state to reflect simulated observation
        setSensors((prev) =>
          prev.map((s) =>
            s.id === sensor.id
              ? {
                  ...s,
                  waterLevelM: updatedLevel,
                  lastPing: "Just now (ESP32-MQTT)",
                }
              : s
          )
        );
      }
    } catch (err) {
      setIngestionStatus(`Ingestion failed: ${String(err)}`);
    } finally {
      setIsSimulatingIngestion(false);
    }
  };

  return (
    <section id="water-twin" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Hydrological Water Twin & IoT Sensor Network
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Real-time stage gauges, tidal lock gate actuators, sump pumps & water quality anomaly detection
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>8 of 8 IoT Nodes Active</span>
        </div>
      </div>

      {/* IoT Telemetry Simulation Status Banner */}
      {ingestionStatus && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            {ingestionStatus}
          </span>
          <button
            onClick={() => setIngestionStatus(null)}
            className="text-slate-400 hover:text-white underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3D Hydraulic Sluice Gate Simulator & Backflow Interlock */}
      <HydraulicSluiceGate3D />

      {/* Sensor Nodes Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((sensor) => {
          const isWarning = sensor.status === "warning" || sensor.anomalyDetected;
          return (
            <GlassCard
              key={sensor.id}
              tone={isWarning ? "elevated" : "standard"}
              className={`p-4 flex flex-col justify-between ${
                isWarning ? "border-amber-500/40" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                    {sensor.stationCode}
                  </span>
                  <Badge variant={isWarning ? "amber" : "emerald"} size="sm">
                    {sensor.status.toUpperCase()}
                  </Badge>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 mt-1.5 leading-snug">
                  {sensor.name}
                </h4>

                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Water Level</span>
                    <span
                      className={`text-lg font-bold telemetry-num ${
                        sensor.waterLevelM >= sensor.warningLevelM
                          ? "text-rose-400"
                          : "text-cyan-300"
                      }`}
                    >
                      {sensor.waterLevelM} m
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Danger: {sensor.dangerLevelM}m
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Discharge</span>
                    <span className="text-lg font-bold text-slate-200 telemetry-num">
                      {sensor.dischargeCusecs}
                    </span>
                    <span className="text-[10px] text-slate-500 block">cusecs</span>
                  </div>
                </div>

                {/* Secondary Water Quality Metrics */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>Turbidity: {sensor.turbidityNtu} NTU</span>
                  <span>DO: {sensor.dissolvedOxygenMgL} mg/L</span>
                </div>

                {sensor.anomalyMessage && (
                  <p className="mt-2.5 text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-500/30 font-mono leading-relaxed">
                    ⚠ {sensor.anomalyMessage}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{sensor.lastPing}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSimulateSensorReading(sensor)}
                  disabled={isSimulatingIngestion}
                  icon={<Send className="w-3 h-3" />}
                  className="text-[11px] py-1 px-2 text-cyan-400"
                >
                  Simulate Ping
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};
