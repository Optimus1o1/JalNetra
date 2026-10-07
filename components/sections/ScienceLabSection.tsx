"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Globe2, CloudRain, Cpu } from "lucide-react";

const GlobalClimateSection = dynamic(
  () => import("@/components/sections/GlobalClimateSection").then((m) => m.GlobalClimateSection),
  { ssr: false, loading: () => <LoadingState title="Loading Planetary Teleconnections & ENSO/IOD Globe..." /> }
);

const RainfallNowcastSection = dynamic(
  () => import("@/components/sections/RainfallNowcastSection").then((m) => m.RainfallNowcastSection),
  { ssr: false, loading: () => <LoadingState title="Mounting Doppler Radar & Convective Nowcasting Canvas..." /> }
);

const ModelLabSection = dynamic(
  () => import("@/components/sections/ModelLabSection").then((m) => m.ModelLabSection),
  { ssr: false, loading: () => <LoadingState title="Compiling PINN Surrogate Architecture & MLOps Pipeline..." /> }
);

function LoadingState({ title }: { title: string }) {
  return (
    <div className="p-12 rounded-xl border border-slate-800 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-slate-300">{title}</span>
    </div>
  );
}

export function ScienceLabSection() {
  const [activeTab, setActiveTab] = useState<"climate" | "radar" | "pinn">("radar");

  return (
    <div className="space-y-6">
      {/* Science Lab Header Banner */}
      <GlassCard tone="elevated" className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Hydrological Science Lab & Surrogate Physics Engine
              </h1>
              <Badge variant="purple">OFFLINE TRAINED SURROGATES</Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic numerical modeling, Physics-Informed Neural Network (PINN) inference, and multi-sensor nowcasting.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeTab === "radar"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" /> Doppler Nowcast
            </button>
            <button
              onClick={() => setActiveTab("climate")}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeTab === "climate"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" /> Planetary Teleconnections
            </button>
            <button
              onClick={() => setActiveTab("pinn")}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeTab === "pinn"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> PINN Architecture
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Render Active Science Lab View with lazy WebGL initialization */}
      {activeTab === "radar" && <RainfallNowcastSection />}
      {activeTab === "climate" && <GlobalClimateSection />}
      {activeTab === "pinn" && <ModelLabSection />}
    </div>
  );
}
