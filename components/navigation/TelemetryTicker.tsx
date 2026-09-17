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
    <div className="w-full bg-[#06090f] border-b border-[#151d2c] py-1 px-4 text-xs">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sky-400 shrink-0 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-widest uppercase">TELEMETRY // FEED-ACTIVE</span>
        </div>

        {/* Ticker items */}
        <div className="hidden lg:flex items-center gap-5 text-slate-300 font-mono text-[10px] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <Satellite className="w-3 h-3 text-sky-400" />
            <span className="text-slate-400">GPM IMERG:</span>
            <span className="text-sky-300 font-medium">0.1° NRT [SYNCED]</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Waves className="w-3 h-3 text-sky-400" />
            <span className="text-slate-400">ENSO 3.4:</span>
            <span className="text-slate-200 font-medium">+{enso.nino34AnomalyC.toFixed(2)}°C ({enso.phase})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">IOD DMI:</span>
            <span className="text-emerald-300 font-medium">+{iod.dmiAnomalyC.toFixed(2)}°C ({iod.phase})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">MJO:</span>
            <span className="text-amber-300 font-medium">PH-{mjo.phase} (A={mjo.amplitude})</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span className="text-slate-400">THREAT:</span>
            <span className="text-rose-400 font-bold">2 BREACH ADVISORIES</span>
          </div>
        </div>

        {/* Clocks & Coordinates */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="tabular-nums font-semibold text-slate-200">{istTime}</span>
            <span className="text-slate-600">|</span>
            <span className="tabular-nums text-slate-400">{utcTime}</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">22.5726°N 88.3639°E</span>
        </div>
      </div>
    </div>
  );
};
