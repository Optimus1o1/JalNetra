"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Box, BarChart2 } from "lucide-react";
import { Hydrograph3D } from "@/components/3d/Hydrograph3D";

interface CockpitHydrographPanelProps {
  className?: string;
}

export const CockpitHydrographPanel: React.FC<CockpitHydrographPanelProps> = ({ className = "" }) => {
  const [hydrographMode, setHydrographMode] = useState<"2d" | "3d">("3d");
  const [scrubIndex, setScrubIndex] = useState(4); // 4 = T_0 NOW
  const [isPlaying, setIsPlaying] = useState(false);

  const timeSlices = [
    { label: "-12h", time: "06:14" },
    { label: "-9h", time: "09:14" },
    { label: "-6h", time: "12:14" },
    { label: "-3h", time: "15:14" },
    { label: "T_0 NOW", time: "18:14" },
    { label: "+3h", time: "21:14" },
    { label: "+6h", time: "00:14" },
    { label: "+9h", time: "03:14" },
    { label: "+12h", time: "06:14" },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setScrubIndex((prev) => (prev + 1) % timeSlices.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, timeSlices.length]);

  return (
    <div className={`glass-card p-5 space-y-4 ${className}`}>
      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              HYDRODYNAMIC NOWCAST & RADAR QPE SCRUBBER
            </span>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              T-12H Antecedent → T+12H Predictive Runoff
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            24-hour continuous stage tracking calibrated with Alipore S-Band Doppler & Outram Ghat tidal gauge
          </p>
        </div>

        {/* 2D vs 3D Switcher & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#070b14] border border-slate-800 p-1 rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setHydrographMode("2d")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                hydrographMode === "2d"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>2D DUAL-AXIS</span>
            </button>
            <button
              type="button"
              onClick={() => setHydrographMode("3d")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                hydrographMode === "3d"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D VOLUMETRIC</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-cyan-400 rounded-xs" />
              <span className="text-slate-400 text-[11px]">STAGE (m MSL)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-cyan-400/30 border border-cyan-400 rounded-xs" />
              <span className="text-slate-400 text-[11px]">RADAR (mm/h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-rose-500 rounded-xs" />
              <span className="text-rose-400 text-[11px]">BREACH (2.80m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Chart Viewport: 3D Volumetric or 2D Dual-Axis */}
      {hydrographMode === "3d" ? (
        <div className="rounded-lg overflow-hidden border border-slate-800/80 bg-[#060a12]">
          <Hydrograph3D
            scrubIndex={scrubIndex}
            onSelectScrubIndex={(idx) => setScrubIndex(idx)}
            isPlaying={isPlaying}
          />
        </div>
      ) : (
        <div className="relative h-44 w-full bg-[#060a12] rounded-lg border border-slate-800/80 p-4 flex flex-col justify-between">
          <div className="absolute inset-x-4 top-10 border-b border-rose-500/40 border-dashed pointer-events-none flex justify-end pr-2">
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
              CRITICAL FLOOD EMBANKMENT CREST +2.80m
            </span>
          </div>

          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
            {/* Precipitation Bars */}
            <rect x="40" y="65" width="20" height="35" fill="#38bdf8" fillOpacity="0.3" rx="2" />
            <rect x="100" y="55" width="20" height="45" fill="#38bdf8" fillOpacity="0.3" rx="2" />
            <rect x="160" y="42" width="20" height="58" fill="#38bdf8" fillOpacity="0.35" rx="2" />
            <rect x="220" y="30" width="20" height="70" fill="#38bdf8" fillOpacity="0.4" rx="2" />
            <rect x="280" y="18" width="20" height="82" fill="#38bdf8" fillOpacity="0.5" rx="2" />
            <rect x="340" y="15" width="20" height="85" fill="#38bdf8" fillOpacity="0.6" rx="2" />
            <rect x="400" y="24" width="20" height="76" fill="#38bdf8" fillOpacity="0.5" rx="2" />
            <rect x="460" y="38" width="20" height="62" fill="#38bdf8" fillOpacity="0.4" rx="2" />

            {/* T0 Marker */}
            <line x1="500" y1="0" x2="500" y2="100" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />

            {/* Predictive Bars */}
            <rect x="520" y="30" width="20" height="70" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1" rx="2" />
            <rect x="580" y="15" width="20" height="85" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1" rx="2" />
            <rect x="640" y="10" width="20" height="90" fill="#ef4444" fillOpacity="0.6" stroke="#ef4444" strokeWidth="1.5" rx="2" />
            <rect x="700" y="25" width="20" height="75" fill="#f59e0b" fillOpacity="0.45" stroke="#f59e0b" strokeWidth="1" rx="2" />
            <rect x="760" y="45" width="20" height="55" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1" rx="2" />
            <rect x="820" y="60" width="20" height="40" fill="#38bdf8" fillOpacity="0.2" rx="2" />
            <rect x="880" y="70" width="20" height="30" fill="#38bdf8" fillOpacity="0.2" rx="2" />

            {/* Historical Hydrograph Curve */}
            <path d="M0,80 Q150,78 300,65 T500,32" fill="none" stroke="#38bdf8" strokeWidth="3" />

            {/* Confidence Ribbon */}
            <path d="M500,32 Q620,12 740,24 T950,56 L950,78 Q740,46 620,38 T500,32 Z" fill="#38bdf8" fillOpacity="0.12" />

            {/* Predictive Curve Exceeding Breach Crest */}
            <path d="M500,32 Q600,14 650,8 T780,42 T950,68" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="8,4" />
            <circle cx="650" cy="8" r="6" fill="#ef4444" className="animate-pulse" />
          </svg>

          <div className="absolute left-1/2 top-2 transform -translate-x-1/2 bg-cyan-500 text-black font-mono text-[11px] px-2.5 py-0.5 rounded font-bold shadow-md">
            T_0 NOW (18:14 IST)
          </div>
        </div>
      )}

      {/* Scrubber Timeline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex items-center gap-2 cursor-pointer font-mono text-xs font-semibold transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "PAUSE REPLAY" : "AUTO SCRUB"}</span>
          </button>
          <span className="text-slate-500 text-xs font-mono hidden sm:inline">1-HOUR INTERVALS</span>
        </div>

        {/* Time Slice Pills */}
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {timeSlices.map((ts, idx) => {
            const isSelected = scrubIndex === idx;
            return (
              <button
                key={ts.label}
                onClick={() => setScrubIndex(idx)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-xs"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
                }`}
              >
                {ts.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
