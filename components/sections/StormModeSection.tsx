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
  const [isSimulatingDrawdown, setIsSimulatingDrawdown] = useState<boolean>(false);
  const [drawdownSimulationComplete, setDrawdownSimulationComplete] = useState<boolean>(false);

  const handleSimulateDrawdown = () => {
    setIsSimulatingDrawdown(true);
    setTimeout(() => {
      setIsSimulatingDrawdown(false);
      setDrawdownSimulationComplete(true);
      setTimeout(() => setDrawdownSimulationComplete(false), 8000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Alert */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>ADVISORY / SIMULATION NOTICE:</strong> Pre-storm detention drawdown actions displayed below represent simulated planning recommendations. Actual gate and sluice operations remain under executive authority of KMC Sewerage & Drainage Directorate.
          </span>
        </div>
        <Badge variant="amber" className="text-[10px] shrink-0">PLANNING PROTOCOL</Badge>
      </div>

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
              <Button variant="secondary" size="sm" onClick={onNavigateToPlanner}>
                <Layers className="w-3.5 h-3.5 mr-1" />
                Intervention Matrix
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSimulateDrawdown}
              disabled={isSimulatingDrawdown}
            >
              <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
              {isSimulatingDrawdown ? "Simulating Drawdown..." : "Simulate Coordinated Drawdown"}
            </Button>
          </div>
        </div>
      </div>

      {drawdownSimulationComplete && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>COORDINATED DRAWDOWN SIMULATED:</strong> 42.4 ML capacity primed across 24 pilot catchments. Peak drainage load reduced by 34.6% at Palmer's Bridge Outfall.
            </span>
          </div>
          <Badge variant="emerald" className="text-[10px]">SUCCESS</Badge>
        </div>
      )}

      {/* Protocol Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>DETENTION BUFFER CAPACITY</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">42.4 ML</div>
          <p className="text-xs text-slate-400">
            Distributed retention capacity available if secondary storage tanks are emptied ahead of peak storm influx.
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>OUTFALL CONGESTION RELIEF</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">-34.6%</div>
          <p className="text-xs text-slate-400">
            Peak discharge reduction heading into Palmer's Bridge, Ballygunge, and Dhapa pumping stations during high tide lock.
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>AQUIFER INJECTION RATE</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">12.8 ML/day</div>
          <p className="text-xs text-slate-400">
            High-permeability deep recharge wells in Wards 66, 68, and 93 active for direct vadose infiltration.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
