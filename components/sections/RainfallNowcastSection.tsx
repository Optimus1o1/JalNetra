"use client";

import React, { useState } from "react";
import { MULTI_HORIZON_FORECASTS } from "@/lib/data/climateIndicesData";
import { CloudRain, Compass, AlertCircle, BarChart3, Clock } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";

export const RainfallNowcastSection: React.FC = () => {
  const [selectedHorizon, setSelectedHorizon] = useState<string>("3-Hour Storm Window");

  const activeForecast =
    MULTI_HORIZON_FORECASTS.find((f) => f.horizon === selectedHorizon) ||
    MULTI_HORIZON_FORECASTS[2];

  const getIntensityBadge = (category: string) => {
    switch (category) {
      case "Extremely Severe":
        return <Badge variant="rose">Extremely Severe (&gt;100mm)</Badge>;
      case "Very Heavy":
        return <Badge variant="amber">Very Heavy (35-100mm)</Badge>;
      case "Heavy":
        return <Badge variant="cyan">Heavy (7.5-35mm)</Badge>;
      default:
        return <Badge variant="emerald">Moderate</Badge>;
    }
  };

  return (
    <section id="rainfall" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Rainfall Intelligence & Probabilistic Nowcasting
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Multi-horizon prediction calibrated to local drainage thresholds (P10, P50 & P90 Ensembles)
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next Model Run: 15:30 IST</span>
        </div>
      </div>

      {/* Multi-Horizon Horizon Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {MULTI_HORIZON_FORECASTS.map((item) => {
          const isSelected = selectedHorizon === item.horizon;
          return (
            <div
              key={item.horizon}
              onClick={() => setSelectedHorizon(item.horizon)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-b from-cyan-950/70 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/50 scale-[1.02]"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                {item.validTime}
              </span>
              <h4 className="text-xs font-bold text-slate-100 mt-0.5 truncate">{item.horizon}</h4>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-cyan-300 telemetry-num">
                  {item.p50}
                </span>
                <span className="text-[10px] font-mono text-slate-400">mm</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>P90: {item.p90}mm</span>
                <span className="text-cyan-400 font-semibold">{item.probabilityOfPrecip}% PoP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Horizon Inspection Card */}
      <GlassCard tone="elevated" className="p-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                SELECTED FORECAST WINDOW
              </span>
              {getIntensityBadge(activeForecast.intensityCategory)}
            </div>

            <h3 className="text-xl font-bold text-slate-100">
              {activeForecast.horizon} (Valid: {activeForecast.validTime})
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Rainfall predictions are derived from an ensemble combining Doppler Weather Radar (DWR)
              echo tracking, NASA GPM IMERG satellite nowcasting, and regional high-resolution WRF
              simulations. Rather than a deterministic single value, JalNetra exposes full probabilistic
              quantiles.
            </p>

            {/* Quantile Breakdown */}
            <div className="grid grid-cols-3 gap-3 pt-2 font-mono">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">P10 (Optimistic)</span>
                <span className="text-xl font-bold text-emerald-300 telemetry-num mt-0.5 block">
                  {activeForecast.p10} mm
                </span>
                <span className="text-[10px] text-slate-500">10% chance below this</span>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[10px] text-cyan-400 uppercase font-semibold block">
                  P50 (Median)
                </span>
                <span className="text-xl font-bold text-cyan-200 telemetry-num mt-0.5 block">
                  {activeForecast.p50} mm
                </span>
                <span className="text-[10px] text-cyan-400/80">Most likely outcome</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-rose-400 uppercase block">P90 (Worst-Case)</span>
                <span className="text-xl font-bold text-rose-300 telemetry-num mt-0.5 block">
                  {activeForecast.p90} mm
                </span>
                <span className="text-[10px] text-slate-500">Emergency planning tail</span>
              </div>
            </div>
          </div>

          {/* Scientific Threshold Calibration Note */}
          <div className="w-full lg:w-96 p-4 rounded-xl bg-slate-900/70 border border-slate-800 font-mono text-xs space-y-3">
            <h4 className="text-slate-200 font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Blueprint Rule: No Fixed 100mm Heuristics
            </h4>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Standard civil warnings often state &quot;100 mm = flood&quot;. In the JalNetra Digital
              Twin, vulnerability curves are locally calibrated:
            </p>

            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Ward 66 (Topsia):</strong> Waterlogging begins at just <strong>38 mm/3h</strong> due to wetland depression.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">•</span>
                <span>
                  <strong>Ward 46 (Esplanade):</strong> Tolerates up to <strong>72 mm/3h</strong> due to high natural Hooghly levee gradient.
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              Dynamic threshold recalibration runs weekly with walk-forward Bayesian updates.
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};
