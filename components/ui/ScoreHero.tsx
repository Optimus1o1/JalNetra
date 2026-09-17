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
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        bar: "from-amber-500 to-rose-500",
        glow: "shadow-[0_0_25px_rgba(239,68,68,0.25)]",
      };
    }
    if (val >= 0.5) {
      return {
        text: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        bar: "from-cyan-500 to-amber-500",
        glow: "shadow-[0_0_25px_rgba(245,158,11,0.2)]",
      };
    }
    if (val >= 0.25) {
      return {
        text: "text-cyan-400",
        badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        bar: "from-emerald-500 to-cyan-500",
        glow: "shadow-[0_0_25px_rgba(6,182,212,0.2)]",
      };
    }
    return {
      text: "text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      bar: "from-emerald-500 to-emerald-400",
      glow: "shadow-[0_0_25px_rgba(16,185,129,0.2)]",
    };
  };

  const theme = getTheme(score);

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 border backdrop-blur-2xl transition-all duration-300",
        "bg-gradient-to-b from-[rgba(15,23,42,0.9)] to-[rgba(7,13,30,0.95)] border-slate-800/80 shadow-2xl",
        "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border-t before:border-white/[0.12]",
        theme.glow,
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-wider uppercase text-cyan-400 font-semibold">
            {title}
          </span>
          <h3 className="text-lg font-semibold text-slate-100 mt-0.5">{subtitle}</h3>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-mono font-medium border",
              theme.badge
            )}
          >
            ● {statusLabel}
          </span>
          {deltaText && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
              {deltaText}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-3">
        <span
          className={cn(
            "text-5xl sm:text-6xl font-extrabold tracking-tight telemetry-num",
            theme.text
          )}
        >
          {score.toFixed(2)}
        </span>
        <span className="text-sm font-mono text-slate-400">
          / 1.00 Index ({percentage}th Percentile Vulnerability)
        </span>
      </div>

      {/* Range gauge bar */}
      <div className="mt-4">
        <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-500",
              theme.bar
            )}
            style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-0.5">
          <span>0.00 Low</span>
          <span>0.25 Moderate</span>
          <span>0.50 Elevated</span>
          <span>0.75 Severe</span>
          <span>1.00 Catastrophic</span>
        </div>
      </div>
    </div>
  );
};
