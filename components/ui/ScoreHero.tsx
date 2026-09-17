import React from "react";
import { cn } from "@/lib/utils";

interface ScoreHeroProps {
  score: number; // 0.0 to 1.0
  title: string;
  subtitle: string;
  statusLabel: string;
  deltaText?: string;
  className?: string;
}

export const ScoreHero: React.FC<ScoreHeroProps> = ({
  score,
  title,
  subtitle,
  statusLabel,
  deltaText,
  className,
}) => {
  const percentage = Math.round(score * 100);

  const getTheme = (val: number) => {
    if (val >= 0.75) {
      return {
        text: "text-rose-400",
        badge: "bg-rose-500/10 text-rose-300 border-rose-500/30",
        bar: "bg-rose-500",
        indicator: "bg-rose-500",
      };
    }
    if (val >= 0.5) {
      return {
        text: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        bar: "bg-amber-400",
        indicator: "bg-amber-400",
      };
    }
    if (val >= 0.25) {
      return {
        text: "text-sky-400",
        badge: "bg-sky-500/10 text-sky-300 border-sky-500/30",
        bar: "bg-sky-400",
        indicator: "bg-sky-400",
      };
    }
    return {
      text: "text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      bar: "bg-emerald-400",
      indicator: "bg-emerald-400",
    };
  };

  const theme = getTheme(score);

  return (
    <div
      className={cn(
        "relative rounded p-5 border transition-all duration-150 corner-bracket",
        "bg-[#0d121e]/90 border-[#1c2638] shadow-sm",
        className
      )}
    >
      {/* Top Header Flange */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c2638]/70 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", theme.indicator)} />
            <span className="text-[10px] font-mono tracking-widest uppercase text-sky-400 font-semibold">
              {title}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-100 mt-1">{subtitle}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-mono font-medium border uppercase tracking-wider",
              theme.badge
            )}
          >
            {statusLabel}
          </span>
          {deltaText && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#162030] text-slate-300 border border-[#24334a]">
              {deltaText}
            </span>
          )}
        </div>
      </div>

      {/* Main Score Readout */}
      <div className="mt-4 flex items-baseline gap-3">
        <span
          className={cn(
            "text-4xl sm:text-5xl font-bold tracking-tight font-mono tabular-nums",
            theme.text
          )}
        >
          {score.toFixed(2)}
        </span>
        <span className="text-xs font-mono text-slate-400">
          / 1.00 Threat Index ({percentage}th Percentile Inundation Risk)
        </span>
      </div>

      {/* Precision Graduated Range Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="w-full h-2 bg-[#162030] rounded-sm overflow-hidden p-0.5 border border-[#24334a]">
          <div
            className={cn("h-full rounded-xs transition-all duration-300", theme.bar)}
            style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider px-0.5">
          <span>0.00 Nominal</span>
          <span>0.25 Moderate</span>
          <span>0.50 Elevated</span>
          <span>0.75 Severe</span>
          <span>1.00 Critical</span>
        </div>
      </div>
    </div>
  );
};
