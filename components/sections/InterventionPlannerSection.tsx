"use client";

import React, { useState, useEffect, useTransition } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { KMC_CATCHMENT_SITES } from "@/lib/data/rainwaterSitesData";
import { simulateInterventionScenario } from "@/lib/domain/interventionPlanner";
import { InterventionScenarioComparison } from "@/lib/domain/types";
import {
  Sliders,
  PlaySquare,
  Droplets,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  Waves,
  RefreshCw,
} from "lucide-react";

interface InterventionPlannerSectionProps {
  initialWardNumber?: number;
  onNavigateToCommandCenter?: () => void;
}

export const InterventionPlannerSection: React.FC<InterventionPlannerSectionProps> = ({
  initialWardNumber = 66,
  onNavigateToCommandCenter,
}) => {
  const [selectedWard, setSelectedWard] = useState<number>(initialWardNumber);
  const [rainfallMm, setRainfallMm] = useState<number>(65);
  const [addedStorageKiloLitres, setAddedStorageKiloLitres] = useState<number>(80);
  const [permeablePavementPct, setPermeablePavementPct] = useState<number>(25);
  const [activeRechargeWells, setActiveRechargeWells] = useState<boolean>(true);
  const [efficiencyBoostPct, setEfficiencyBoostPct] = useState<number>(15);

  const [isPending, startTransition] = useTransition();
  const [scenarioComparison, setScenarioComparison] = useState<InterventionScenarioComparison>(() => {
    const sites = KMC_CATCHMENT_SITES.filter((s) => s.wardNumber === initialWardNumber);
    return simulateInterventionScenario({
      scenarioName: `Ward ${initialWardNumber} Baseline vs Circular Plan`,
      wardNumber: initialWardNumber,
      rainfallEventMm: 65,
      sites: sites.length > 0 ? sites : KMC_CATCHMENT_SITES,
      captureEfficiencyBoostPct: 15,
      addedStorageCapacityL: 80_000,
      activeRechargeWells: true,
      permeablePavementFractionPct: 25,
    });
  });

  const availableWards = Array.from(new Set(KMC_CATCHMENT_SITES.map((s) => s.wardNumber)));

  // Re-run scenario calculations on input changes with instant transitions
  useEffect(() => {
    startTransition(() => {
      let sites = KMC_CATCHMENT_SITES.filter((s) => s.wardNumber === selectedWard);
      if (sites.length === 0) sites = KMC_CATCHMENT_SITES;

      const comp = simulateInterventionScenario({
        scenarioName: `Ward ${selectedWard} Priority Intervention Analysis`,
        wardNumber: selectedWard,
        rainfallEventMm: rainfallMm,
        sites,
        captureEfficiencyBoostPct: efficiencyBoostPct,
        addedStorageCapacityL: addedStorageKiloLitres * 1000,
        activeRechargeWells,
        permeablePavementFractionPct: permeablePavementPct,
      });
      setScenarioComparison(comp);
    });
  }, [
    selectedWard,
    rainfallMm,
    addedStorageKiloLitres,
    permeablePavementPct,
    activeRechargeWells,
    efficiencyBoostPct,
  ]);

  const { baseline, intervention, deltas } = scenarioComparison;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Intervention Planner & Runoff Avoidance Simulator
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              CIRCULAR WATER ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Simulate how localized rainwater capture, cistern storage, and aquifer recharge eliminate urban drainage pressure.
          </p>
        </div>

        {onNavigateToCommandCenter && (
          <Button variant="glass" size="sm" onClick={onNavigateToCommandCenter}>
            ← Command Center
          </Button>
        )}
      </div>

      {/* Main Grid: Control Panel (Left 4 cols) & Comparative Dashboard (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PARAMETER SLIDERS */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard tone="standard" className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Intervention Levers
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">
                PROVENANCE: SIMULATED
              </span>
            </div>

            {/* Ward Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Target Catchment Ward:</span>
                <span className="text-cyan-400 font-bold">Ward {selectedWard}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableWards.map((wNum) => (
                  <button
                    key={wNum}
                    onClick={() => setSelectedWard(wNum)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                      selectedWard === wNum
                        ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/60 shadow-sm shadow-cyan-500/20"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    Ward {wNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Rainfall Event Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Design Rainfall Event:</span>
                <span className="text-cyan-400 font-bold">{rainfallMm} mm</span>
              </div>
              <input
                type="range"
                min={20}
                max={150}
                step={5}
                value={rainfallMm}
                onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>20 mm (Mod)</span>
                <span>65 mm (Heavy)</span>
                <span>150 mm (Extreme)</span>
              </div>
            </div>

            {/* Added Storage Capacity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Added Modular Storage:</span>
                <span className="text-emerald-400 font-bold">+{addedStorageKiloLitres} kL</span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={addedStorageKiloLitres}
                onChange={(e) => setAddedStorageKiloLitres(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0 kL (Existing)</span>
                <span>150 kL</span>
                <span>300 kL (Mega-Cistern)</span>
              </div>
            </div>

            {/* Permeable Pavement Fraction */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Permeable Surface Retrofit:</span>
                <span className="text-cyan-400 font-bold">{permeablePavementPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={permeablePavementPct}
                onChange={(e) => setPermeablePavementPct(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-mono text-slate-300">
                  Artificial Recharge Shaft Infiltration
                </span>
                <input
                  type="checkbox"
                  checked={activeRechargeWells}
                  onChange={(e) => setActiveRechargeWells(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-mono text-slate-300">
                  First-Flush Efficiency Optimization (+15%)
                </span>
                <input
                  type="checkbox"
                  checked={efficiencyBoostPct > 0}
                  onChange={(e) => setEfficiencyBoostPct(e.target.checked ? 15 : 0)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>
          </GlassCard>

          {/* Execution Receipt Box */}
          <div className="p-4 rounded-xl bg-[#030d1a] border border-cyan-500/30 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-cyan-400 text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED INTERVENTION RECEIPT
              </span>
              <span className="text-[10px] text-slate-400">{scenarioComparison.scenarioId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-cyan-500/20">
              <div>
                <span className="text-slate-400">Runoff Reduction:</span>
                <div className="text-emerald-400 font-bold text-sm">
                  {deltas.runoffReductionPct}% Avoided
                </div>
              </div>
              <div>
                <span className="text-slate-400">Drainage Relief:</span>
                <div className="text-cyan-400 font-bold text-sm">
                  -{deltas.drainageReliefCumec} m³/s
                </div>
              </div>
              <div>
                <span className="text-slate-400">Avoided Economic Loss:</span>
                <div className="text-amber-400 font-bold">
                  ₹ {deltas.avoidedLossCroresINR} Crores
                </div>
              </div>
              <div>
                <span className="text-slate-400">Harvest Volume:</span>
                <div className="text-blue-300 font-bold">
                  {intervention.capturedVolumeML} ML
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BASELINE VS INTERVENTION COMPARISON */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Comparative Delta Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GlassCard tone="standard" className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Runoff Avoidance
              </span>
              <div className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                {deltas.runoffAvoidedML} ML
              </div>
              <span className="text-[10px] font-mono text-emerald-400/80">
                {deltas.runoffReductionPct}% eliminated from drains
              </span>
            </GlassCard>

            <GlassCard tone="standard" className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                New Water Captured
              </span>
              <div className="text-xl font-bold text-cyan-400 font-mono flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +{deltas.capturedIncreaseML} ML
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80">
                Direct cistern storage
              </span>
            </GlassCard>

            <GlassCard tone="standard" className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Groundwater Recharge
              </span>
              <div className="text-xl font-bold text-blue-400 font-mono flex items-center gap-1">
                <Droplets className="w-4 h-4" />
                +{deltas.rechargeIncreaseML} ML
              </div>
              <span className="text-[10px] font-mono text-blue-400/80">
                Aquifer infiltration
              </span>
            </GlassCard>
          </div>

          {/* Deep Comparative Matrix */}
          <GlassCard tone="standard" className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Hydrological Mass Balance: Baseline vs. Intervention
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                UNITS: MILLION LITRES (ML)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2">HYDROMETRIC COMPONENT</th>
                    <th className="py-2 text-rose-300">BASELINE (Status Quo)</th>
                    <th className="py-2 text-emerald-300">JALNETRA INTERVENTION</th>
                    <th className="py-2 text-cyan-300">DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  <tr>
                    <td className="py-2.5 font-semibold">Total Gross Precipitation</td>
                    <td className="py-2.5">{baseline.totalRainfallVolumeML} ML</td>
                    <td className="py-2.5">{intervention.totalRainfallVolumeML} ML</td>
                    <td className="py-2.5 text-slate-400">0.00 ML</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-rose-300">
                      Uncontrolled Urban Runoff
                    </td>
                    <td className="py-2.5 text-rose-400 font-bold">
                      {baseline.uncontrolledRunoffML} ML
                    </td>
                    <td className="py-2.5 text-emerald-400 font-bold">
                      {intervention.uncontrolledRunoffML} ML
                    </td>
                    <td className="py-2.5 text-emerald-400 font-bold">
                      -{deltas.runoffAvoidedML} ML (-{deltas.runoffReductionPct}%)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Cistern Stored & Harvested</td>
                    <td className="py-2.5">{baseline.capturedVolumeML} ML</td>
                    <td className="py-2.5 text-cyan-300">{intervention.capturedVolumeML} ML</td>
                    <td className="py-2.5 text-cyan-400 font-bold">
                      +{deltas.capturedIncreaseML} ML
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Non-Potable Demand Reused</td>
                    <td className="py-2.5">{baseline.reusedVolumeML} ML</td>
                    <td className="py-2.5 text-cyan-300">{intervention.reusedVolumeML} ML</td>
                    <td className="py-2.5 text-cyan-400 font-bold">
                      +{deltas.reusedIncreaseML} ML
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Aquifer Infiltration Recharged</td>
                    <td className="py-2.5">{baseline.rechargedVolumeML} ML</td>
                    <td className="py-2.5 text-blue-300">{intervention.rechargedVolumeML} ML</td>
                    <td className="py-2.5 text-blue-400 font-bold">
                      +{deltas.rechargeIncreaseML} ML
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Canal Outfall Drainage Load</td>
                    <td className="py-2.5 text-rose-400">{baseline.canalDrainageLoadCumec} m³/s</td>
                    <td className="py-2.5 text-emerald-400">
                      {intervention.canalDrainageLoadCumec} m³/s
                    </td>
                    <td className="py-2.5 text-emerald-400 font-bold">
                      -{deltas.drainageReliefCumec} m³/s
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual Balance Progress Comparison */}
            <div className="pt-3 space-y-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Baseline Runoff Fraction:</span>
                <span className="text-rose-400 font-bold">
                  {(
                    (baseline.uncontrolledRunoffML /
                      Math.max(0.01, baseline.totalRainfallVolumeML)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (baseline.uncontrolledRunoffML /
                        Math.max(0.01, baseline.totalRainfallVolumeML)) *
                        100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-slate-300 pt-1">
                <span>With JalNetra Interventions Runoff Fraction:</span>
                <span className="text-emerald-400 font-bold">
                  {(
                    (intervention.uncontrolledRunoffML /
                      Math.max(0.01, intervention.totalRainfallVolumeML)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (intervention.uncontrolledRunoffML /
                        Math.max(0.01, intervention.totalRainfallVolumeML)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
