"use client";

import React, { useState, useEffect } from "react";
import { CLIMATE_INDICES_SNAPSHOT } from "@/lib/data/climateIndicesData";
import { Radio, Activity, Satellite, Waves, AlertTriangle, Clock } from "lucide-react";

export const TelemetryTicker: React.FC = () => {
  const { enso, iod, mjo } = CLIMATE_INDICES_SNAPSHOT;
  const [utcTime, setUtcTime] = useState<string>("12:00:00Z");
  const [istTime, setIstTime] = useState<string>("17:30:00 IST");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + "Z");
      setIstTime(
        now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#050811]/90 backdrop-blur-md border-b border-slate-800/60 py-1.5 px-4 text-xs z-40">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wider text-slate-300 uppercase">TELEMETRY FEED</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-cyan-400 font-medium hidden sm:inline">LIVE NRT</span>
        </div>

        {/* Streamlined Ticker Indicators */}
        <div className="hidden md:flex items-center gap-6 text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-500">GPM IMERG:</span>
            <span className="text-slate-200 font-medium">0.1° NRT [SYNCED]</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-500">ENSO:</span>
            <span className="text-slate-200 font-medium">+{enso.nino34AnomalyC.toFixed(2)}°C</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500">IOD:</span>
            <span className="text-emerald-400 font-medium">+{iod.dmiAnomalyC.toFixed(2)}°C</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500">STATUS:</span>
            <span className="text-amber-400 font-semibold">2 ADVISORIES</span>
          </div>
        </div>

        {/* Live Synchronized Clocks */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="tabular-nums font-semibold text-slate-200">{istTime}</span>
          <span className="text-slate-700">/</span>
          <span className="tabular-nums text-slate-400 hidden sm:inline">{utcTime}</span>
        </div>
      </div>
    </div>
  );
};
