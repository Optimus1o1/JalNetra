"use client";

import React from "react";
import { CLIMATE_INDICES_SNAPSHOT } from "@/lib/data/climateIndicesData";
import { Radio, Activity, Satellite, Waves, AlertTriangle } from "lucide-react";

export const TelemetryTicker: React.FC = () => {
  const { enso, iod, mjo } = CLIMATE_INDICES_SNAPSHOT;

  return (
    <div className="w-full bg-[#030712] border-b border-cyan-950/60 py-1.5 px-4 overflow-hidden text-xs">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-cyan-400 shrink-0 font-mono text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-semibold tracking-wider uppercase">JALNETRA TELEMETRY STREAM</span>
        </div>

        {/* Ticker items */}
        <div className="hidden md:flex items-center gap-6 text-slate-300 font-mono text-[11px] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">GPM IMERG:</span>
            <span className="text-cyan-300 font-medium">0.1° NRT Ingested (18m Latency)</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Waves className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">ENSO (Niño 3.4):</span>
            <span className="text-purple-300 font-medium">+{enso.nino34AnomalyC.toFixed(2)}°C ({enso.phase})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">IOD (DMI):</span>
            <span className="text-emerald-300 font-medium">+{iod.dmiAnomalyC.toFixed(2)}°C ({iod.phase})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">MJO:</span>
            <span className="text-amber-300 font-medium">Phase {mjo.phase} (Amp {mjo.amplitude})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">Active Alerts:</span>
            <span className="text-rose-300 font-medium font-bold">2 Critical</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 shrink-0">
          <span className="text-slate-300 font-medium">KMC Pilot Basin</span> | 22.57°N, 88.36°E
        </div>
      </div>
    </div>
  );
};
