"use client";

import React from "react";
import { MODEL_REGISTRY, DATA_FRESHNESS_MONITORS } from "@/lib/data/modelsData";
import { Cpu, CheckCircle2, ShieldCheck, Database, Award, Activity, AlertTriangle } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";

export const ModelLabSection: React.FC = () => {
  return (
    <section id="models" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Model Lab & Scientific Validation
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            CRPS calibration, spatial IoU benchmarks, data leakage audits & automated pipeline freshness
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>Champion: Spatiotemporal PINN v2.4.1</span>
        </div>
      </div>

      {/* Model Architectures Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {MODEL_REGISTRY.map((model) => {
          const isChampion = model.status === "active_production";
          return (
            <GlassCard
              key={model.id}
              tone={isChampion ? "accent" : "standard"}
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                    {model.version}
                  </span>
                  <Badge
                    variant={
                      isChampion
                        ? "cyan"
                        : model.status === "challenger_evaluation"
                        ? "purple"
                        : "slate"
                    }
                    size="sm"
                  >
                    {model.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-100 mt-2">{model.name}</h3>

                <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
                  {model.description}
                </p>

                {/* Metrics Table */}
                <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CRPS Score</span>
                    <span className="text-base font-bold text-cyan-300 telemetry-num">
                      {model.metrics.crpsScore.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">(Lower is better)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Brier Score</span>
                    <span className="text-base font-bold text-cyan-300 telemetry-num">
                      {model.metrics.brierScore.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Prob. Calibration</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Spatial IoU</span>
                    <span className="text-base font-bold text-emerald-300 telemetry-num">
                      {(model.metrics.spatialIoU * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Flood Boundary</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">False Alert Rate</span>
                    <span className="text-base font-bold text-rose-300 telemetry-num">
                      {(model.metrics.falseAlertRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">FAR (&lt;10% target)</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>Latency: <span className="text-slate-200 font-bold">{model.metrics.latencyMs} ms</span></div>
                  <div>Window: <span className="text-slate-200">{model.trainingWindow}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                Calibrated: {model.lastCalibrated}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Data Ingestion Pipeline Freshness & Leakage Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Data Pipeline Latency Table */}
        <GlassCard tone="elevated" className="p-5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-cyan-400" />
            Data Pipeline Latency & Ingestion Health
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5">Data Feed</th>
                  <th className="py-2 px-2.5">Cadence</th>
                  <th className="py-2 px-2.5">Latency</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {DATA_FRESHNESS_MONITORS.map((feed, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2.5 font-semibold text-slate-200">{feed.source}</td>
                    <td className="py-2.5 px-2.5 text-slate-400">{feed.cadence}</td>
                    <td className="py-2.5 px-2.5 text-cyan-300 font-bold">{feed.latencyMinutes} mins</td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ● OPTIMAL
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Blueprint Section 19: Data Leakage Protocol */}
        <GlassCard tone="standard" className="p-5 space-y-3 font-mono text-xs">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Scientific Integrity & Temporal Leakage Guard
          </h3>

          <p className="text-slate-300 leading-relaxed">
            Per Section 19 of the JalNetra Blueprint, climate models are uniquely prone to
            temporal look-ahead leakage. The platform enforces rigid boundaries:
          </p>

          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Walk-Forward Temporal Split:</strong> At forecast hour T, only satellite
                and NWP products published prior to T are admitted into the feature store.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Satellite Ground Truth Calibration:</strong> NASA GPM IMERG estimates
                are continuously adjusted against IMD Alipore physical tipping-bucket rain gauges.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Probabilistic Honesty:</strong> Deterministic 100% predictions are
                disallowed; all predictions provide P10/P50/P90 confidence intervals.
              </span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </section>
  );
};
