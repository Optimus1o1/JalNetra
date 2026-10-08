"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GlassNav } from "@/components/navigation/GlassNav";
import { TelemetryTicker } from "@/components/navigation/TelemetryTicker";
import { Footer } from "@/components/navigation/Footer";
import { DigitalTwinMap } from "@/components/gis/DigitalTwinMap";
import { ScoreHero } from "@/components/ui/ScoreHero";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { INITIAL_ALERTS } from "@/lib/data/alertsData";
import { GridCell, SimulationScenarioResult } from "@/lib/types";

// Static Section Components
import { CockpitHydrographPanel } from "@/components/cockpit/CockpitHydrographPanel";
import { CockpitTacticalDispatch } from "@/components/cockpit/CockpitTacticalDispatch";
import { CellDetailDrawer } from "@/components/gis/CellDetailDrawer";

// Lazy-loaded Section Components to conserve WebGL contexts and memory
const InterventionPlannerSection = dynamic(
  () => import("@/components/sections/InterventionPlannerSection").then((m) => m.InterventionPlannerSection),
  { ssr: false, loading: () => <LoadingView label="Mounting Municipal Intervention Decision Planner..." /> }
);

const WaterBalanceSection = dynamic(
  () => import("@/components/sections/WaterBalanceSection").then((m) => m.WaterBalanceSection),
  { ssr: false, loading: () => <LoadingView label="Solving Dynamic Water Mass Balance Flows..." /> }
);

const StormModeSection = dynamic(
  () => import("@/components/sections/StormModeSection").then((m) => m.StormModeSection),
  { ssr: false, loading: () => <LoadingView label="Activating Storm Influx & Pre-Storm Drawdown Engine..." /> }
);

const SensorsSection = dynamic(
  () => import("@/components/sections/SensorsSection").then((m) => m.SensorsSection),
  { ssr: false, loading: () => <LoadingView label="Streaming IoT & Cistern Telemetry Fleet..." /> }
);

const ScienceLabSection = dynamic(
  () => import("@/components/sections/ScienceLabSection").then((m) => m.ScienceLabSection),
  { ssr: false, loading: () => <LoadingView label="Initializing Science Lab (Radar & PINN Engine)..." /> }
);

const WaterTwinSection = dynamic(
  () => import("@/components/sections/WaterTwinSection").then((m) => m.WaterTwinSection),
  { ssr: false, loading: () => <LoadingView label="Mounting Hydraulic Sluice Digital Twin..." /> }
);

const VulnerabilitySection = dynamic(
  () => import("@/components/sections/VulnerabilitySection").then((m) => m.VulnerabilitySection),
  { ssr: false, loading: () => <LoadingView label="Computing Basin Vulnerability Matrix..." /> }
);

const SimulationSection = dynamic(
  () => import("@/components/sections/SimulationSection").then((m) => m.SimulationSection),
  { ssr: false, loading: () => <LoadingView label="Loading What-If Hydraulic Simulation Engine..." /> }
);

const AlertsSection = dynamic(
  () => import("@/components/sections/AlertsSection").then((m) => m.AlertsSection),
  { ssr: false, loading: () => <LoadingView label="Loading Incident Triage & Alerts Grid..." /> }
);

function LoadingView({ label }: { label: string }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl border border-slate-800 bg-slate-950/60 backdrop-blur-md space-y-3">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-slate-300">{label}</span>
    </div>
  );
}

import {
  CloudRain,
  Waves,
  Activity,
  AlertTriangle,
  PlaySquare,
  ShieldAlert,
  Bell,
  Cpu,
  LayoutDashboard,
  ArrowRight,
  Layers,
  Droplets,
  Zap,
} from "lucide-react";

export default function JalNetraApp() {
  const [activeScreen, setActiveScreen] = useState<string>("cockpit");
  const [activeSimulationResult, setActiveSimulationResult] = useState<SimulationScenarioResult | null>(null);
  const [selectedWardForDrawer, setSelectedWardForDrawer] = useState<number | null>(null);

  // Sync active screen with URL hash on mount and hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (
        hash &&
        [
          "cockpit",
          "planner",
          "water-balance",
          "storm-mode",
          "sensors",
          "water-twin",
          "vulnerability",
          "simulation",
          "science",
          "alerts",
          "global",
          "rainfall",
          "models",
        ].includes(hash)
      ) {
        if (hash === "global" || hash === "rainfall" || hash === "models") {
          setActiveScreen("science");
        } else {
          setActiveScreen(hash);
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Effective cells (overridden by active simulation scenario if present)
  const effectiveCells = activeSimulationResult?.updatedCells || PILOT_GRID_CELLS;

  // Selected cell for slide-out telemetry drawer
  const selectedCell = selectedWardForDrawer
    ? effectiveCells.find((c: GridCell) => c.wardNumber === selectedWardForDrawer) || null
    : null;

  // Top 4 critical wards sorted by risk score
  const topCriticalWards = [...effectiveCells]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Real-time Telemetry Stream Ticker */}
      <TelemetryTicker />

      {/* Main Glass Navigation Header */}
      <GlassNav
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        onTriggerSimulation={() => setActiveScreen("simulation")}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-6">
        {/* VIEW 1: UNIFIED MISSION OPERATIONS COCKPIT */}
        {activeScreen === "cockpit" && (
          <div className="space-y-8">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                    Hooghly-Kolkata Basin Mission Cockpit
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CIRCULAR WATER DIGITAL TWIN // 144 WARDS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
                  Unified urban rainwater intelligence, storage headroom telemetry & tactical dispatch deck
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setActiveScreen("planner")}
                  icon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
                >
                  Intervention Planner
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setActiveScreen("storm-mode")}
                  icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Storm Mode
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setActiveScreen("water-balance")}
                  icon={<Droplets className="w-3.5 h-3.5 text-blue-400" />}
                >
                  Water Balance
                </Button>
              </div>
            </div>

            {/* Circular Water Intelligence Banner */}
            <GlassCard tone="accent" className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40 border-cyan-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-sans">
                        Circular Rainwater Optimization Engine Active
                      </h3>
                      <Badge variant="cyan">KOLKATA PILOT</Badge>
                    </div>
                    <p className="text-xs font-mono text-slate-300 mt-1 max-w-2xl">
                      Transitioning urban stormwater from destructive linear runoff to circular recharge & non-potable reuse.
                      Capturing institutional catchments across SSKM, Tiljala, and Medical College.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-6">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Circularity Index</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                        BENCHMARK PROJECTION
                      </span>
                    </div>
                    <div className="text-lg font-mono font-bold text-cyan-300">
                      42 <span className="text-slate-500 text-xs">→ 84/100</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Baseline 42 vs. intervention target 84 across the pilot catchments.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Harvest Potential</span>
                    <div className="text-lg font-mono font-bold text-emerald-400">1.85 ML/storm</div>
                    <span className="text-[9px] font-mono text-emerald-400/80 block">Simulated Institutional Yield</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Storm Headroom</span>
                    <div className="text-lg font-mono font-bold text-amber-400">336 kL</div>
                    <span className="text-[9px] font-mono text-amber-400/80 block">Available Cistern Capacity</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Tier 1: Regional Risk Hero & 4 Primary Telemetry StatCards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1">
                <ScoreHero
                  score={0.74}
                  title="KMC PILOT BASIN VULNERABILITY"
                  subtitle="Greater Kolkata & Hooghly Delta Basin"
                  statusLabel="Critical Inundation Risk"
                  deltaText="+18% vs Antecedent Norm"
                />
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  label="Multi-Horizon Nowcast (3h Window)"
                  value="64.0"
                  unit="mm (P50 Median)"
                  icon={<CloudRain className="w-5 h-5" />}
                  status="critical"
                  trend={{ direction: "up", label: "88% PoP Heavy", isPositive: false }}
                  onClick={() => setActiveScreen("science")}
                />

                <StatCard
                  label="Hooghly Tidal Stage (Outram Ghat)"
                  value="5.42"
                  unit="meters MSL"
                  icon={<Waves className="w-5 h-5" />}
                  status="warn"
                  trend={{ direction: "up", label: "High Tide in 2h 40m", isPositive: false }}
                  onClick={() => setActiveScreen("water-twin")}
                />

                <StatCard
                  label="IoT Monitoring Node Fleet"
                  value="12 / 12"
                  unit="Active Sensors & Tanks"
                  icon={<Activity className="w-5 h-5" />}
                  status="ok"
                  trend={{ direction: "neutral", label: "3 RWH Tanks Monitored", isPositive: true }}
                  onClick={() => setActiveScreen("sensors")}
                />

                <StatCard
                  label="Active Early Warning Alerts"
                  value="2 Crit"
                  unit="/ 2 High Priority"
                  icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
                  status="critical"
                  trend={{ direction: "up", label: "W-66 & W-131 Imminent", isPositive: false }}
                  onClick={() => setActiveScreen("alerts")}
                />
              </div>
            </div>

            {/* Tier 2: Spatial Digital Twin & Priority Incident Hotspots Rail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive GIS Twin Canvas (8/12) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-sans flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                      Spatial Digital Twin & Ward Inundation Canvas
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Real-time fusion of GPM precipitation, DEM elevation, drainage sumps & RWH buffers
                    </p>
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setActiveScreen("simulation")}
                    icon={<PlaySquare className="w-3 h-3" />}
                  >
                    Simulate Interventions
                  </Button>
                </div>

                {/* Simulation Scenario Active Notice Banner */}
                {activeSimulationResult && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono text-cyan-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>
                        ACTIVE SCENARIO OVERLAY: <strong>{activeSimulationResult.scenarioName}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveSimulationResult(null)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] cursor-pointer"
                    >
                      Revert to Live Telemetry
                    </button>
                  </div>
                )}

                <DigitalTwinMap
                  onSelectWard={(wardNo) => setSelectedWardForDrawer(wardNo)}
                  selectedWardNumber={selectedWardForDrawer}
                  overrideCells={activeSimulationResult?.updatedCells}
                  onTriggerSimulationForWard={(wardNum) => {
                    setSelectedWardForDrawer(wardNum);
                    setActiveScreen("simulation");
                  }}
                />
              </div>

              {/* Right Column: Triage & Priority Alerts Rail (4/12) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Active Alerts Fast Triage */}
                <GlassCard tone="standard" className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h4 className="text-[11px] font-mono font-bold uppercase text-slate-200 flex items-center gap-1.5 tracking-wider">
                      <Bell className="w-3.5 h-3.5 text-rose-400" />
                      Priority Incident Triage
                    </h4>
                    <button
                      onClick={() => setActiveScreen("alerts")}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      All ({INITIAL_ALERTS.length}) <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {INITIAL_ALERTS.slice(0, 2).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg bg-[#0a0f1d] border border-rose-500/30 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-rose-400">
                            {alert.alertCode}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {alert.issuedAt.split("(")[0]}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-100">{alert.title}</h5>
                        <p className="text-[11px] text-slate-300 font-mono leading-tight">
                          {alert.affectedInfrastructure[0]}
                        </p>
                        <div className="pt-1.5 flex items-center justify-between border-t border-slate-800/60 mt-1">
                          <span className="text-[10px] font-mono text-cyan-400">
                            CONFIDENCE: {(alert.confidenceScore * 100).toFixed(0)}%
                          </span>
                          <button
                            onClick={() => setActiveScreen("alerts")}
                            className="text-[10px] font-mono text-cyan-300 hover:underline cursor-pointer"
                          >
                            DISPATCH ACTION →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Top Critical Wards Quick Access */}
                <GlassCard tone="standard" className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h4 className="text-[11px] font-mono font-bold uppercase text-slate-200 flex items-center gap-1.5 tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Highest Inundation Hotspots
                    </h4>
                    <button
                      onClick={() => setActiveScreen("vulnerability")}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      Matrix <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    {topCriticalWards.map((ward) => (
                      <div
                        key={ward.id}
                        className="p-2.5 rounded-lg bg-[#0a0f1d] border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center justify-between cursor-pointer"
                        onClick={() => setSelectedWardForDrawer(ward.wardNumber)}
                      >
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">
                            Ward {ward.wardNumber}: {ward.wardName.split("/")[0]}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Ponding: {ward.waterloggingDepthCm}cm • Elev: {ward.elevation}m
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border tabular-nums ${
                            ward.riskScore >= 0.75
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {ward.riskScore.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Tier 3: 24-Hour Nowcast Hydrograph & 3D Radar Scrubber */}
            <CockpitHydrographPanel />

            {/* Tier 4: Tactical Runoff Dispatch Engine & Hydraulic Relief Solver */}
            <CockpitTacticalDispatch onNavigateToSimulation={() => setActiveScreen("simulation")} />
          </div>
        )}

        {/* VIEW 2: MUNICIPAL INTERVENTION PLANNER (FLAGSHIP) */}
        {activeScreen === "planner" && <InterventionPlannerSection />}

        {/* VIEW 3: WATER MASS BALANCE ENGINE */}
        {activeScreen === "water-balance" && (
          <WaterBalanceSection onNavigateToPlanner={() => setActiveScreen("planner")} />
        )}

        {/* VIEW 4: ACTIVE STORM INFLUX & DRAWDOWN MODE */}
        {activeScreen === "storm-mode" && (
          <StormModeSection onNavigateToPlanner={() => setActiveScreen("planner")} />
        )}

        {/* VIEW 5: IOT SENSORS & TANK FLEET */}
        {activeScreen === "sensors" && (
          <SensorsSection onNavigateToPlanner={() => setActiveScreen("planner")} />
        )}

        {/* VIEW 6: WATER TWIN (SLUICE GATE 3D) */}
        {activeScreen === "water-twin" && <WaterTwinSection />}

        {/* VIEW 7: VULNERABILITY MATRIX */}
        {activeScreen === "vulnerability" && (
          <VulnerabilitySection
            onSelectWard={(wardNo) => setSelectedWardForDrawer(wardNo)}
          />
        )}

        {/* VIEW 8: WHAT-IF SIMULATOR */}
        {activeScreen === "simulation" && (
          <SimulationSection
            targetWardNumber={selectedWardForDrawer}
            onClearTargetWard={() => setSelectedWardForDrawer(null)}
            onApplyScenarioToMap={(scen) => setActiveSimulationResult(scen)}
            onNavigateToCockpit={() => setActiveScreen("cockpit")}
          />
        )}

        {/* VIEW 9: SCIENCE LAB (RADAR, CLIMATE & PINN SURROGATES) */}
        {activeScreen === "science" && <ScienceLabSection />}

        {/* VIEW 10: ALERTS & DECISION TRIAGE */}
        {activeScreen === "alerts" && <AlertsSection />}
      </main>

      {/* Slide-out Ward Telemetry & Simulation Drawer */}
      <CellDetailDrawer
        cell={selectedCell}
        onClose={() => setSelectedWardForDrawer(null)}
        onTriggerSimulationForWard={(wardNum) => {
          setSelectedWardForDrawer(wardNum);
          setActiveScreen("simulation");
        }}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
