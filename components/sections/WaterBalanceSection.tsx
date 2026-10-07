"use client";

import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Waves,
  Droplets,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Layers,
  CircleDollarSign,
  Activity,
  RotateCcw,
} from "lucide-react";

interface WaterBalanceSectionProps {
  onNavigateToPlanner?: () => void;
}

export const WaterBalanceSection: React.FC<WaterBalanceSectionProps> = ({
  onNavigateToPlanner,
}) => {
  const [rainfallMm, setRainfallMm] = useState<number>(55);
  const [activeInterventionMode, setActiveInterventionMode] = useState<boolean>(true);

  // Basin baseline catchment metrics: 220,000 m^2 registered institutions
  const catchmentAreaSqM = 220_000;
  const grossRainfallL = rainfallMm * catchmentAreaSqM;
  const grossRainfallML = Number((grossRainfallL / 1_000_000).toFixed(2));

  // Dynamic circular flow calculation: Baseline vs With JalNetra
  const runoffPct = activeInterventionMode ? 28 : 78;
  const capturePct = activeInterventionMode ? 42 : 12;
  const reusePct = activeInterventionMode ? 18 : 6;
  const rechargePct = activeInterventionMode ? 12 : 4;

  const runoffML = Number(((grossRainfallML * runoffPct) / 100).toFixed(2));
  const captureML = Number(((grossRainfallML * capturePct) / 100).toFixed(2));
  const reuseML = Number(((grossRainfallML * reusePct) / 100).toFixed(2));
  const rechargeML = Number(((grossRainfallML * rechargePct) / 100).toFixed(2));

  const circularityScore = activeInterventionMode ? 86 : 38;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Waves className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Circular Water Balance & Mass-Flow Engine
            </h2>
            <Badge variant="cyan">MASS CONSERVATION CLOSED</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Tracking urban precipitation from atmospheric influx to storage, non-potable reuse, and aquifer replenishment.
          </p>
        </div>

        {onNavigateToPlanner && (
          <Button variant="glass" size="sm" onClick={onNavigateToPlanner}>
            Intervention Planner →
          </Button>
        )}
      </div>

      {/* Mode Toggle & Rainfall Quick Lever */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300">Model State:</span>
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveInterventionMode(false)}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                !activeInterventionMode
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              STATUS QUO (78% Runoff)
            </button>
            <button
              onClick={() => setActiveInterventionMode(true)}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeInterventionMode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              WITH JALNETRA (Circular Mode)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">Design Rainfall:</span>
          <span className="text-cyan-400 font-bold">{rainfallMm} mm</span>
          <input
            type="range"
            min={20}
            max={120}
            step={5}
            value={rainfallMm}
            onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
            className="w-32 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Primary Circular Flow Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Gross Rain */}
        <GlassCard tone="standard" className="p-4 space-y-2 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>1. INFLUX</span>
            <span>100%</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{grossRainfallML} ML</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Total rainfall across 220,000 m² registered institutional catchment area.
          </p>
        </GlassCard>

        {/* Step 2: Captured */}
        <GlassCard tone="standard" className="p-4 space-y-2 border-l-4 border-l-cyan-400">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>2. CAPTURED</span>
            <span className="text-cyan-400 font-bold">{capturePct}%</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{captureML} ML</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Diverted via first-flush filters into modular cisterns and storage sumps.
          </p>
        </GlassCard>

        {/* Step 3: Reused & Recharged */}
        <GlassCard tone="standard" className="p-4 space-y-2 border-l-4 border-l-blue-400">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>3. UTILIZED</span>
            <span className="text-blue-400 font-bold">{reusePct + rechargePct}%</span>
          </div>
          <div className="text-2xl font-bold text-blue-300 font-mono">
            {(reuseML + rechargeML).toFixed(2)} ML
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {reuseML} ML non-potable reuse + {rechargeML} ML deep aquifer infiltration.
          </p>
        </GlassCard>

        {/* Step 4: Runoff to Drains */}
        <GlassCard
          tone="standard"
          className={`p-4 space-y-2 border-l-4 ${
            activeInterventionMode ? "border-l-emerald-500" : "border-l-rose-500"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>4. RUNOFF DISCHARGE</span>
            <span
              className={`font-bold ${
                activeInterventionMode ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {runoffPct}%
            </span>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              activeInterventionMode ? "text-emerald-300" : "text-rose-400"
            }`}
          >
            {runoffML} ML
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {activeInterventionMode
              ? "Over 50% drainage load eliminated from KMC canals."
              : "Catastrophic street ponding and canal backflow imminent."}
          </p>
        </GlassCard>
      </div>

      {/* Circularity Score & Flow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Score Overview (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard tone="standard" className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Water Circularity Index
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">PROVENANCE: SIMULATED</span>
            </div>

            <div className="text-center py-4 space-y-1">
              <div
                className={`text-6xl font-bold font-mono ${
                  circularityScore >= 80
                    ? "text-cyan-400"
                    : circularityScore >= 60
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {circularityScore}
              </div>
              <div className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                {activeInterventionMode ? "OPTIMAL CIRCULARITY" : "CRITICAL RUNOFF DEFICIT"}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Capture Score:</span>
                <span className="text-slate-200 font-bold">{capturePct * 2}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Demand Offset:</span>
                <span className="text-slate-200 font-bold">{reusePct * 4}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recharge Index:</span>
                <span className="text-slate-200 font-bold">{rechargePct * 6}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Canal Relief:</span>
                <span className="text-slate-200 font-bold">{100 - runoffPct}/100</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Visual Mass-Flow Balance Representation (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <GlassCard tone="standard" className="p-5 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Precipitation Partitioning Across Kolkata Basin
            </h3>

            {/* Mass-Balance Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Mass Partitioning (Sum = 100%):</span>
                <span>{grossRainfallML} ML Total</span>
              </div>
              <div className="h-6 w-full rounded-lg overflow-hidden flex text-[10px] font-bold text-slate-950 text-center leading-6">
                <div
                  className="bg-cyan-400 transition-all duration-500"
                  style={{ width: `${capturePct}%` }}
                >
                  {capturePct > 10 ? `Capture ${capturePct}%` : ""}
                </div>
                <div
                  className="bg-blue-400 transition-all duration-500"
                  style={{ width: `${reusePct}%` }}
                >
                  {reusePct > 8 ? `Reuse ${reusePct}%` : ""}
                </div>
                <div
                  className="bg-emerald-400 transition-all duration-500"
                  style={{ width: `${rechargePct}%` }}
                >
                  {rechargePct > 8 ? `Recharge ${rechargePct}%` : ""}
                </div>
                <div
                  className="bg-rose-500 text-white transition-all duration-500"
                  style={{ width: `${runoffPct}%` }}
                >
                  Runoff {runoffPct}%
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Cistern Capture
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Non-Potable Reuse
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Aquifer Recharge
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Uncontrolled Runoff
                </span>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 mt-4">
              <div className="font-bold text-slate-200">Hydrological Impact Summary:</div>
              <p className="text-slate-400 leading-relaxed">
                {activeInterventionMode ? (
                  <>
                    By deploying modular rooftop cisterns, bio-retention swales, and dual infiltration shafts, the city intercepts <strong>{captureML} ML</strong> of stormwater before it can enter silted drainage canals like Bagjola and Tolly's Nullah. This satisfies <strong>{reuseML} ML</strong> of institutional non-potable demand and safely recharges <strong>{rechargeML} ML</strong> into the regional aquifer.
                  </>
                ) : (
                  <>
                    Under baseline conditions without rainwater harvesting infrastructure, <strong>{runoffML} ML (78%)</strong> of rainfall immediately accumulates as surface ponding. Canal water stages exceed drainage thresholds, triggering estuarine backwater locks and localized ward inundation.
                  </>
                )}
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
