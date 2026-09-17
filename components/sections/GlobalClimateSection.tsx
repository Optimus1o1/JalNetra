"use client";

import React from "react";
import { CLIMATE_INDICES_SNAPSHOT, GLOBAL_PRECIPITATION_ANOMALIES } from "@/lib/data/climateIndicesData";
import { Globe2, Satellite, Waves, Activity, Radio, ArrowUpRight, ShieldCheck } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";

import { GlobalClimateGlobe3D } from "../3d/GlobalClimateGlobe3D";

export const GlobalClimateSection: React.FC = () => {
  const { enso, iod, mjo, sstAnomalyBayOfBengalC, lastUpdated } = CLIMATE_INDICES_SNAPSHOT;

  return (
    <section id="global" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Global Climate & Teleconnection Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Upstream atmospheric context fusing NASA GPM IMERG, NOAA CPC indices & ECMWF ERA5
          </p>
        </div>

        <Badge variant="cyan" size="md">
          <Satellite className="w-3 h-3 mr-1" />
          {lastUpdated}
        </Badge>
      </div>

      {/* 3D Interactive Terrestrial Globe with SST Anomaly Heatmaps */}
      <GlobalClimateGlobe3D />

      {/* Primary Teleconnection Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ENSO (Niño 3.4) */}
        <GlassCard tone="standard" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
              PACIFIC TELECONNECTION
            </span>
            <Badge variant="purple" size="sm">
              {enso.phase}
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-slate-100 mt-2">
            ENSO (Niño 3.4 SST Anomaly)
          </h3>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-purple-300 telemetry-num">
              +{enso.nino34AnomalyC.toFixed(2)}°C
            </span>
            <span className="text-xs font-mono text-slate-400">
              Anomaly (Conf: {enso.confidencePct}%)
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
            {enso.teleconnectionNote}
          </p>
        </GlassCard>

        {/* Indian Ocean Dipole (IOD) */}
        <GlassCard tone="standard" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              INDIAN OCEAN BASIN
            </span>
            <Badge variant="emerald" size="sm">
              {iod.phase}
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-slate-100 mt-2">
            IOD (Dipole Mode Index - DMI)
          </h3>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-300 telemetry-num">
              +{iod.dmiAnomalyC.toFixed(2)}°C
            </span>
            <span className="text-xs font-mono text-slate-400">Moisture Pump Active</span>
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
            {iod.teleconnectionNote}
          </p>
        </GlassCard>

        {/* Madden-Julian Oscillation (MJO) */}
        <GlassCard tone="standard" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              INTRA-SEASONAL PULSE
            </span>
            <Badge variant="amber" size="sm">
              Active Pulse
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-slate-100 mt-2">
            MJO (Phase & Amplitude)
          </h3>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-amber-300 telemetry-num">
              Phase {mjo.phase}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Amp: {mjo.amplitude} ({mjo.monsoonSurgeProbability}% surge prob)
            </span>
          </div>

          <div className="mt-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">
              Convective Center
            </span>
            {mjo.convectiveCenter}
          </div>
        </GlassCard>
      </div>

      {/* NASA GPM IMERG Global Precipitation Anomaly Matrix */}
      <GlassCard tone="elevated" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Satellite className="w-4 h-4 text-cyan-400" />
              NASA GPM IMERG Global Satellite Precipitation Anomalies
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Near-Real-Time 0.1° Gridded Estimates (Half-Hourly Precipitation Run)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Operational NRT Ingestion</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Global Region</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Precip Rate (mm/h)</th>
                <th className="py-2.5 px-3">Z-Score Anomaly</th>
                <th className="py-2.5 px-3">Climatological Percentile</th>
                <th className="py-2.5 px-3">Satellite Product</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {GLOBAL_PRECIPITATION_ANOMALIES.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {item.region}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {item.lat}°N, {item.lng}°E
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">
                    {item.precipitationRateMmH.toFixed(1)} mm/h
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        item.anomalyZScore >= 2.0
                          ? "bg-rose-500/20 text-rose-300 font-bold"
                          : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      +{item.anomalyZScore.toFixed(1)}σ
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {item.percentileRank}th %ile
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{item.sourceProduct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </section>
  );
};
