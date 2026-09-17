import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: "ok" | "warn" | "critical" | "info";
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  status = "ok",
  trend,
  onClick,
  className,
}) => {
  const statusBadge = {
    ok: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    warn: "border-amber-500/40 text-amber-300 bg-amber-500/10",
    critical: "border-rose-500/40 text-rose-400 bg-rose-500/10",
    info: "border-sky-500/30 text-sky-400 bg-sky-500/10",
  };

  const statusIndicator = {
    ok: "bg-emerald-400",
    warn: "bg-amber-400",
    critical: "bg-rose-500 animate-pulse",
    info: "bg-sky-400",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded p-4 border transition-all duration-150 corner-bracket",
        "bg-[#0d121e]/90 border-[#1c2638] shadow-sm",
        onClick && "hover:border-sky-500/40 hover:bg-[#111726] cursor-pointer",
        className
      )}
    >
      {/* Top Header Flange */}
      <div className="flex items-center justify-between border-b border-[#1c2638]/70 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full", statusIndicator[status])} />
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400/80">{icon}</span>
          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400 transition-colors" />
          )}
        </div>
      </div>

      {/* Main Metric Figure */}
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono tracking-tight tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-mono font-medium text-slate-400">
              {unit}
            </span>
          )}
        </div>

        {trend && (
          <span
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider",
              trend.isPositive !== false
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            )}
          >
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "■"}{" "}
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
};
