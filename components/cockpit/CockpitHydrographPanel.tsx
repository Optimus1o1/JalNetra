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
    { label: "-12h", time: "06:14", stage: 1.2, rain: 15, x: 60, y: 80 },
    { label: "-9h", time: "09:14", stage: 1.35, rain: 22, x: 170, y: 74 },
    { label: "-6h", time: "12:14", stage: 1.7, rain: 35, x: 280, y: 64 },
    { label: "-3h", time: "15:14", stage: 2.1, rain: 48, x: 390, y: 48 },
    { label: "T_0 NOW", time: "18:14", stage: 2.45, rain: 52, x: 500, y: 32 },
    { label: "+3h", time: "21:14", stage: 2.92, rain: 58, x: 610, y: 14 },
    { label: "+6h", time: "00:14", stage: 3.1, rain: 64, x: 720, y: 8 },
    { label: "+9h", time: "03:14", stage: 2.55, rain: 38, x: 830, y: 30 },
    { label: "+12h", time: "06:14", stage: 1.85, rain: 18, x: 940, y: 60 },
  ];

  const currentSlice = timeSlices[scrubIndex] || timeSlices[4];
  const currentMarkerX = currentSlice.x;
  const currentMarkerY = currentSlice.y;
  const isBreaching = currentSlice.stage >= 2.8;

  const handleSvgPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const nearestIdx = Math.round(ratio * (timeSlices.length - 1));
    setScrubIndex(nearestIdx);
  };

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
        <div 
          className="relative h-48 w-full bg-[#060a12] rounded-lg border border-slate-800/80 p-4 flex flex-col justify-between select-none cursor-crosshair"
          onPointerDown={handleSvgPointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) handleSvgPointer(e);
          }}
        >
          {/* Embankment Crest Reference Line */}
          <div className="absolute inset-x-4 top-10 border-b border-rose-500/40 border-dashed pointer-events-none flex justify-end pr-2 z-0">
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
              CRITICAL FLOOD EMBANKMENT CREST +2.80m
            </span>
          </div>

          <svg 
            className="w-full h-full overflow-visible" 
            preserveAspectRatio="none" 
            viewBox="0 0 1000 100"
          >
            {/* Precipitation Bars */}
            <rect x="50" y="65" width="20" height="35" fill="#38bdf8" fillOpacity={scrubIndex === 0 ? 0.7 : 0.25} rx="2" />
            <rect x="160" y="55" width="20" height="45" fill="#38bdf8" fillOpacity={scrubIndex === 1 ? 0.7 : 0.25} rx="2" />
            <rect x="270" y="42" width="20" height="58" fill="#38bdf8" fillOpacity={scrubIndex === 2 ? 0.7 : 0.3} rx="2" />
            <rect x="380" y="30" width="20" height="70" fill="#38bdf8" fillOpacity={scrubIndex === 3 ? 0.7 : 0.35} rx="2" />
            <rect x="490" y="24" width="20" height="76" fill="#38bdf8" fillOpacity={scrubIndex === 4 ? 0.8 : 0.4} rx="2" />

            {/* Predictive Bars */}
            <rect x="600" y="15" width="20" height="85" fill="#ef4444" fillOpacity={scrubIndex === 5 ? 0.85 : 0.45} stroke="#ef4444" strokeWidth="1" rx="2" />
            <rect x="710" y="10" width="20" height="90" fill="#ef4444" fillOpacity={scrubIndex === 6 ? 0.9 : 0.55} stroke="#ef4444" strokeWidth="1.5" rx="2" />
            <rect x="820" y="25" width="20" height="75" fill="#f59e0b" fillOpacity={scrubIndex === 7 ? 0.8 : 0.4} stroke="#f59e0b" strokeWidth="1" rx="2" />
            <rect x="930" y="45" width="20" height="55" fill="#38bdf8" fillOpacity={scrubIndex === 8 ? 0.7 : 0.3} stroke="#38bdf8" strokeWidth="1" rx="2" />

            {/* Historical Hydrograph Curve */}
            <path d="M0,80 Q150,78 300,65 T500,32" fill="none" stroke="#38bdf8" strokeWidth="3" />

            {/* Confidence Ribbon */}
            <path d="M500,32 Q620,12 740,24 T950,56 L950,78 Q740,46 620,38 T500,32 Z" fill="#38bdf8" fillOpacity="0.12" />

            {/* Predictive Curve Exceeding Breach Crest */}
            <path d="M500,32 Q600,14 650,8 T780,42 T950,68" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="8,4" />

            {/* Dynamic Scrubber Vertical Scanning Line & Coordinate Pin */}
            <g className="transition-all duration-200 ease-out pointer-events-none">
              {/* Shaded vertical aura slice */}
              <rect
                x={currentMarkerX - 22}
                y="0"
                width="44"
                height="100"
                fill={isBreaching ? "#ef4444" : "#38bdf8"}
                fillOpacity="0.10"
              />
              {/* Dynamic vertical marker line */}
              <line
                x1={currentMarkerX}
                y1="0"
                x2={currentMarkerX}
                y2="100"
                stroke={isBreaching ? "#ef4444" : "#38bdf8"}
                strokeWidth={scrubIndex === 4 ? "2.5" : "2"}
                strokeDasharray={scrubIndex === 4 ? "none" : "3,3"}
                className={isBreaching ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"}
              />
              {/* Active Inspection Node on Hydrograph curve */}
              <circle
                cx={currentMarkerX}
                cy={currentMarkerY}
                r="6"
                fill={isBreaching ? "#ef4444" : "#38bdf8"}
                stroke="#ffffff"
                strokeWidth="2"
                className="animate-pulse"
              />
              <circle
                cx={currentMarkerX}
                cy={currentMarkerY}
                r="11"
                fill="none"
                stroke={isBreaching ? "#ef4444" : "#38bdf8"}
                strokeWidth="1.5"
                opacity="0.6"
              />
            </g>
          </svg>

          {/* Dynamic Floating HUD Badge synchronized with time marker */}
          <div
            style={{ left: `${Math.max(16, Math.min(84, (currentMarkerX / 1000) * 100))}%` }}
            className={`absolute top-2 transform -translate-x-1/2 transition-all duration-200 font-mono text-[11px] px-3 py-1 rounded-md font-bold shadow-xl flex items-center gap-2 pointer-events-none z-10 whitespace-nowrap border ${
              isBreaching
                ? "bg-rose-950/95 border-rose-500/80 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-1 ring-rose-500/50"
                : scrubIndex === 4
                ? "bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "bg-slate-900/95 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            }`}
          >
            <span>{currentSlice.label} ({currentSlice.time} IST)</span>
            <span className={scrubIndex === 4 ? "text-slate-800" : "text-slate-500"}>•</span>
            <span className={isBreaching ? "text-rose-300 font-extrabold" : scrubIndex === 4 ? "text-black" : "text-white"}>
              +{currentSlice.stage.toFixed(2)}m MSL
            </span>
            <span className={scrubIndex === 4 ? "text-slate-800" : "text-slate-500"}>•</span>
            <span className={scrubIndex === 4 ? "text-slate-900" : "text-cyan-400"}>
              {currentSlice.rain} mm/h
            </span>
            {isBreaching && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] uppercase tracking-wider animate-pulse">
                BREACH ALERT
              </span>
            )}
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
