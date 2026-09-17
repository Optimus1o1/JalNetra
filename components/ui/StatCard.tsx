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
  const statusColors = {
    ok: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    warn: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    critical: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    info: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
  };

  const statusDot = {
    ok: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
    warn: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
    critical: "bg-rose-400 animate-pulse shadow-[0_0_8px_#ef4444]",
    info: "bg-cyan-400 shadow-[0_0_8px_#06b6d4]",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl p-5 border backdrop-blur-xl transition-all duration-300",
        "bg-[rgba(11,18,33,0.78)] border-slate-800/80 shadow-lg shadow-black/40",
        "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border-t before:border-white/[0.08]",
        onClick && "hover:border-cyan-500/40 hover:-translate-y-0.5 cursor-pointer",
        className
      )}
    >
      {/* Top row: Icon chip + Action chip */}
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700/60 text-cyan-400 shadow-inner">
          {icon}
          <span
            className={cn(
              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#030712]",
              statusDot[status]
            )}
          />
        </div>

        {onClick && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/40 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Metric details */}
      <p className="mt-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </p>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-slate-100 tracking-tight telemetry-num">
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
              "text-[11px] font-mono px-2 py-0.5 rounded-full border",
              trend.isPositive !== false
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            )}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "•"}{" "}
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
};
