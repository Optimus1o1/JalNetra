"use client";

import React, { useState } from "react";
import { runSimulationScenario } from "@/lib/simulationEngine";
import { SimulationScenarioRequest, SimulationScenarioResult } from "@/lib/types";
import { PlaySquare, Sliders, CheckCircle2, TrendingDown, TrendingUp, ShieldCheck, RefreshCw } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface SimulationSectionProps {
  onApplyScenarioToMap?: (scenario: SimulationScenarioResult) => void;
}

export const SimulationSection: React.FC<SimulationSectionProps> = ({
  onApplyScenarioToMap,
}) => {
  // Scenario inputs state
  const [rainfallMultiplier, setRainfallMultiplier] = useState<number>(1.25);
  const [durationHours, setDurationHours] = useState<number>(6);
  const [drainageEfficiencyPct, setDrainageEfficiencyPct] = useState<number>(-10);
  const [tidalSurgeMeters, setTidalSurgeMeters] = useState<number>(0.8);
  const [emergencyPumpsActive, setEmergencyPumpsActive] = useState<boolean>(true);
  const [sluiceGatesAutomated, setSluiceGatesAutomated] = useState<boolean>(true);
  const [permeablePavementScenario, setPermeablePavementScenario] = useState<boolean>(false);
  const [temporaryBundsDeployed, setTemporaryBundsDeployed] = useState<boolean>(false);

  // Compute live result
  const currentInputs: SimulationScenarioRequest = {
    rainfallMultiplier,
    durationHours,
    drainageEfficiencyPct,
    tidalSurgeMeters,
    emergencyPumpsActive,
    sluiceGatesAutomated,
    permeablePavementScenario,
    temporaryBundsDeployed,
  };

  const [simulationResult, setSimulationResult] = useState<SimulationScenarioResult>(() =>
    runSimulationScenario(currentInputs)
  );

  const handleRunSimulation = () => {
    const result = runSimulationScenario(currentInputs);
    setSimulationResult(result);
    if (onApplyScenarioToMap) {
      onApplyScenarioToMap(result);
    }
  };

  const handleReset = () => {
    setRainfallMultiplier(1.0);
    setDurationHours(3);
    setDrainageEfficiencyPct(0);
    setTidalSurgeMeters(0.0);
    setEmergencyPumpsActive(false);
    setSluiceGatesAutomated(false);
    setPermeablePavementScenario(false);
    setTemporaryBundsDeployed(false);

    const resetInputs: SimulationScenarioRequest = {
      rainfallMultiplier: 1.0,
      durationHours: 3,
      drainageEfficiencyPct: 0,
      tidalSurgeMeters: 0.0,
      emergencyPumpsActive: false,
      sluiceGatesAutomated: false,
      permeablePavementScenario: false,
      temporaryBundsDeployed: false,
    };
    const res = runSimulationScenario(resetInputs);
    setSimulationResult(res);
  };

  const { summary, wardDeltas } = simulationResult;

  return (
    <section id="simulation" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PlaySquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              &quot;What-If&quot; Scenario Simulator
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Vary rainfall, drainage capacity, tidal surge & emergency civil defence interventions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Reset Default
          </Button>
          <Button variant="primary" size="sm" onClick={handleRunSimulation} icon={<PlaySquare className="w-3.5 h-3.5" />}>
            Execute Simulation
          </Button>
        </div>
      </div>

      {/* Simulator Control Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parameter Sliders */}
        <GlassCard tone="elevated" className="p-6 space-y-5 lg:col-span-1">
          <h3 className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            Environmental Stressors
          </h3>

          {/* Rainfall Multiplier Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Rainfall Multiplier</span>
              <span className="text-cyan-300 font-bold">{rainfallMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={rainfallMultiplier}
              onChange={(e) => setRainfallMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0.5x (Drizzle)</span>
              <span>1.0x (Base)</span>
              <span>2.5x (Cloudburst)</span>
            </div>
          </div>

          {/* Storm Duration */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Storm Duration</span>
              <span className="text-cyan-300 font-bold">{durationHours} Hours</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
              {[1, 3, 6, 24].map((h) => (
                <button
                  key={h}
                  onClick={() => setDurationHours(h)}
                  className={`py-1 rounded border transition-colors ${
                    durationHours === h
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Drainage Efficiency Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Drainage Network Efficiency</span>
              <span
                className={`font-bold ${
                  drainageEfficiencyPct < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {drainageEfficiencyPct > 0 ? `+${drainageEfficiencyPct}` : drainageEfficiencyPct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={drainageEfficiencyPct}
              onChange={(e) => setDrainageEfficiencyPct(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>-50% (Silt / Power Cut)</span>
              <span>0%</span>
              <span>+50% (Desilted)</span>
            </div>
          </div>

          {/* Tidal Surge Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Hooghly Tidal Surge</span>
              <span className="text-amber-400 font-bold">+{tidalSurgeMeters.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.5"
              step="0.1"
              value={tidalSurgeMeters}
              onChange={(e) => setTidalSurgeMeters(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0.0m (Neap Tide)</span>
              <span>1.2m (Spring Tide)</span>
              <span>2.5m (Bore Tide)</span>
            </div>
          </div>

          {/* Emergency Interventions Toggles */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <h4 className="text-[11px] font-mono font-bold uppercase text-slate-300">
              Emergency Civil Defence Measures
            </h4>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyPumpsActive}
                onChange={(e) => setEmergencyPumpsActive(e.target.checked)}
                className="rounded accent-cyan-400 w-4 h-4"
              />
              <span>Deploy Auxiliary Pontoon Pumps (+12 mm/h)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sluiceGatesAutomated}
                onChange={(e) => setSluiceGatesAutomated(e.target.checked)}
                className="rounded accent-cyan-400 w-4 h-4"
              />
              <span>Automated Tidal Sluice Lockout Sync</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={temporaryBundsDeployed}
                onChange={(e) => setTemporaryBundsDeployed(e.target.checked)}
                className="rounded accent-cyan-400 w-4 h-4"
              />
              <span>Pre-stage Sandbag Bunds Around Hospitals</span>
            </label>
          </div>
        </GlassCard>

        {/* Right Columns: Simulation Results Summary & Differential Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Avg Basin Risk
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-100 telemetry-num">
                  {summary.scenarioAvgRisk}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    summary.riskDeltaPct <= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {summary.riskDeltaPct > 0 ? `+${summary.riskDeltaPct}` : summary.riskDeltaPct}%
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Baseline: {summary.baselineAvgRisk}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Critical Wards
              </span>
              <span className="text-2xl font-bold text-rose-400 telemetry-num mt-1 block">
                {summary.criticalWardsCount}
              </span>
              <span className="text-[10px] font-mono text-slate-500">Risk &gt; 0.75 Index</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Spared Citizens
              </span>
              <span className="text-2xl font-bold text-emerald-400 telemetry-num mt-1 block">
                {summary.sparedPopulationEst.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-500">Protected by Interventions</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Economic Mitigation
              </span>
              <span className="text-2xl font-bold text-cyan-300 telemetry-num mt-1 block">
                ₹{summary.mitigatedEconomicRiskCr} Cr
              </span>
              <span className="text-[10px] font-mono text-slate-500">Avoided Commercial Loss</span>
            </div>
          </div>

          {/* Differential Delta Table */}
          <GlassCard tone="standard" className="p-5">
            <h4 className="text-xs font-mono font-semibold uppercase text-slate-300 tracking-wider mb-3">
              Baseline vs. Scenario Risk Differential (Ward Level)
            </h4>

            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-slate-950/90 border-b border-slate-800">
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3">Ward</th>
                    <th className="py-2 px-3">Baseline Risk</th>
                    <th className="py-2 px-3">Scenario Risk</th>
                    <th className="py-2 px-3">Risk Delta</th>
                    <th className="py-2 px-3">Projected Ponding</th>
                    <th className="py-2 px-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {wardDeltas.map((wd) => (
                    <tr key={wd.cellId} className="hover:bg-slate-900/50">
                      <td className="py-2 px-3 font-semibold text-slate-200">
                        Ward {wd.wardNumber} ({wd.wardName.split("/")[0]})
                      </td>
                      <td className="py-2 px-3 text-slate-400">{wd.baselineRisk.toFixed(2)}</td>
                      <td className="py-2 px-3 font-bold text-slate-100">{wd.scenarioRisk.toFixed(2)}</td>
                      <td className="py-2 px-3 font-bold">
                        <span
                          className={
                            wd.delta < 0
                              ? "text-emerald-400"
                              : wd.delta > 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }
                        >
                          {wd.delta > 0 ? `+${wd.delta.toFixed(2)}` : wd.delta.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-cyan-300">{wd.inundationDepthCm} cm</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={
                            wd.status === "mitigated"
                              ? "emerald"
                              : wd.status === "escalated"
                              ? "rose"
                              : "slate"
                          }
                          size="sm"
                        >
                          {wd.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};
