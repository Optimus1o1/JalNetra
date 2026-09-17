"use client";

import React from "react";
import { GridCell } from "@/lib/types";
import { getRiskColor } from "@/lib/utils";
import {
  X,
  ShieldAlert,
  Building2,
  Droplets,
  TrendingUp,
  Hospital,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface CellDetailDrawerProps {
  cell: GridCell | null;
  onClose: () => void;
  onTriggerSimulationForWard?: (wardNumber: number) => void;
}

export const CellDetailDrawer: React.FC<CellDetailDrawerProps> = ({
  cell,
  onClose,
  onTriggerSimulationForWard,
}) => {
  if (!cell) return null;

  const riskTheme = getRiskColor(cell.riskScore);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[rgba(7,13,30,0.96)] backdrop-blur-2xl border-l border-cyan-500/30 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                {cell.borough} • WARD {cell.wardNumber}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${riskTheme.badge}`}
              >
                ● {riskTheme.label}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mt-1">{cell.wardName}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Coordinates: {cell.coordinates[0].toFixed(4)}°N, {cell.coordinates[1].toFixed(4)}°E
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Risk Score</span>
            <span className="text-2xl font-bold text-slate-100 telemetry-num mt-1 block">
              {cell.riskScore.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Hz × Exp × Vuln</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Elevation</span>
            <span className="text-2xl font-bold text-slate-100 telemetry-num mt-1 block">
              {cell.elevation}m
            </span>
            <span className="text-[10px] font-mono text-slate-400">Slope: {cell.slopeDeg}°</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Ponding Depth</span>
            <span className="text-2xl font-bold text-rose-400 telemetry-num mt-1 block">
              {cell.waterloggingDepthCm} cm
            </span>
            <span className="text-[10px] font-mono text-rose-400/80">Est. Inundation</span>
          </div>
        </div>

        {/* Hazard, Exposure & Vulnerability Breakdown */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <h4 className="text-xs font-mono font-semibold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Composite Vulnerability Equation
          </h4>

          <div className="space-y-2.5 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Hazard Indicator (Rain + Antecedent)</span>
                <span className="text-cyan-400 font-bold">{cell.hazardScore.toFixed(2)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${cell.hazardScore * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Exposure (Assets + Population Density)</span>
                <span className="text-purple-400 font-bold">{cell.exposureScore.toFixed(2)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${cell.exposureScore * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Vulnerability (Drainage Silt + Imperviousness)</span>
                <span className="text-amber-400 font-bold">{cell.vulnerabilityScore.toFixed(2)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${cell.vulnerabilityScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SHAP Explainability Decomposition */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-mono font-semibold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Explainable AI Risk Factors (TreeSHAP)
            </h4>
            <span className="text-[10px] font-mono text-cyan-400">Attribution %</span>
          </div>

          <div className="space-y-2">
            {cell.shapFactors.map((factor, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-slate-200">{factor.name}</span>
                  <span
                    className={
                      factor.direction === "increase"
                        ? "text-rose-400 font-bold"
                        : "text-emerald-400 font-bold"
                    }
                  >
                    {factor.direction === "increase" ? "+" : "-"}
                    {factor.contribution}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Exposed Critical Infrastructure */}
        <div className="mt-5">
          <h4 className="text-xs font-mono font-semibold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 mb-2.5">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Exposed Critical Assets in Ward
          </h4>

          <div className="space-y-2 text-xs">
            {cell.criticalAssets.hospitals.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold flex items-center gap-1">
                  <Hospital className="w-3.5 h-3.5" /> Hospitals & Medical Centers
                </span>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {cell.criticalAssets.hospitals.map((h, i) => (
                    <li key={i}>• {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {cell.criticalAssets.pumpingStations.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> Drainage & Outfall Stations
                </span>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {cell.criticalAssets.pumpingStations.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800 mt-6 flex gap-2">
        <Button
          variant="glass"
          className="w-full text-xs"
          onClick={() => {
            if (onTriggerSimulationForWard) {
              onTriggerSimulationForWard(cell.wardNumber);
            }
          }}
        >
          Simulate Interventions for Ward {cell.wardNumber}
        </Button>
      </div>
    </div>
  );
};
