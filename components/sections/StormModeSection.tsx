"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  CloudLightning,
  AlertTriangle,
  ArrowDownToLine,
  Droplets,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

interface StormModeSectionProps {
  onNavigateToPlanner?: () => void;
}

export const StormModeSection: React.FC<StormModeSectionProps> = ({
  onNavigateToPlanner,
}) => {
  const [isExecutingDrawdown, setIsExecutingDrawdown] = useState<boolean>(false);
  const [drawdownComplete, setDrawdownComplete] = useState<boolean>(false);

  const handleExecuteDrawdown = () => {
    setIsExecutingDrawdown(true);
    setTimeout(() => {
      setIsExecutingDrawdown(false);
      setDrawdownComplete(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-cyan-950/60 border border-amber-500/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <CloudLightning className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-sans">
                  Active Storm Influx Mode // 3-Hour Downpour Approaching
                </h2>
                <Badge variant="amber">T-MINUS 140 MIN</Badge>
              </div>
              <p className="text-xs font-mono text-slate-300 mt-0.5">
                P50 Nowcast: <strong>64.0 mm</strong> convective rainfall expected over Greater Kolkata & Hooghly Basin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPlanner && (
              <Button variant="glass" size="sm" onClick={onNavigateToPlanner}>
                Intervention Planner →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Readiness Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard tone="standard" className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Expected Basin Rainfall
          </span>
          <div className="text-2xl font-bold text-amber-400 font-mono">64.0 mm</div>
          <span className="text-[10px] font-mono text-slate-400">
            88% PoP Heavy Rainfall
          </span>
        </GlassCard>

        <GlassCard tone="standard" className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Potential Storm Harvest
          </span>
          <div className="text-2xl font-bold text-cyan-400 font-mono">11.82 ML</div>
          <span className="text-[10px] font-mono text-cyan-400/80">
            Catchment roofs & basins
          </span>
        </GlassCard>

        <GlassCard tone="standard" className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Current Storage Headroom
          </span>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {drawdownComplete ? "0.485 ML" : "0.360 ML"}
          </div>
          <span className="text-[10px] font-mono text-emerald-400">
            {drawdownComplete ? "Drawdown Completed (+125kL free)" : "Constrained headroom"}
          </span>
        </GlassCard>

        <GlassCard tone="standard" className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Pre-emptive Drawdown Target
          </span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">125,000 L</div>
          <span className="text-[10px] font-mono text-emerald-400/80">
            Transfer to recharge wells
          </span>
        </GlassCard>
      </div>

      {/* Two-Column Decision Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pre-Storm Drawdown Action Protocol (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard tone="standard" className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
                Pre-Emptive Storage Drawdown Protocol
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">
                STATUS: {drawdownComplete ? "STANDBY - CAPTURE READY" : "ACTION RECOMMENDED"}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              To maximize stormwater capture and eliminate street flooding, non-potable tanks at municipal institutions must be drawn down into groundwater recharge shafts prior to storm onset. This frees <strong>125,000 Litres</strong> of immediate storage capacity.
            </p>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Target Facility:</span>
                <span className="text-cyan-400 font-bold">Tiljala Depot & SSKM Cisterns</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Discharge Vector:</span>
                <span className="text-blue-300 font-bold">Deep Infiltration Wells (Ward 93 & 57)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Available Time Window:</span>
                <span className="text-amber-400 font-bold">Next 90 Minutes</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExecuteDrawdown}
                  disabled={isExecutingDrawdown || drawdownComplete}
                  className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    drawdownComplete
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  }`}
                >
                  {isExecutingDrawdown ? (
                    <span>DRAINING INTO RECHARGE WELLS...</span>
                  ) : drawdownComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>STORAGE HEADROOM PREPARED (100% READY)</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>EXECUTE PRE-EMPTIVE DRAWDOWN COMMAND</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Storm Checklist & Outfall Lockouts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard tone="standard" className="p-5 space-y-3 font-mono text-xs">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Storm Protection Directives
            </h4>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </span>
                <span>Rooftop first-flush diverters cleared of debris.</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </span>
                <span>Outram Ghat Sluice Gate 01/04 interlocked at High Tide (+5.42m MSL).</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </span>
                <span>Community retention sumps primed for overflow interception.</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
