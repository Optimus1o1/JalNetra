import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(val: number, decimals = 1): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getRiskColor(score: number): {
  badge: string;
  border: string;
  bg: string;
  text: string;
  label: string;
} {
  if (score >= 0.75) {
    return {
      badge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      border: "border-rose-500/40",
      bg: "bg-rose-950/30",
      text: "text-rose-400",
      label: "Critical Inundation",
    };
  }
  if (score >= 0.5) {
    return {
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      border: "border-amber-500/40",
      bg: "bg-amber-950/30",
      text: "text-amber-400",
      label: "Elevated Waterlogging",
    };
  }
  if (score >= 0.25) {
    return {
      badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      border: "border-cyan-500/40",
      bg: "bg-cyan-950/30",
      text: "text-cyan-400",
      label: "Moderate Drainage Stress",
    };
  }
  return {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    border: "border-emerald-500/40",
    bg: "bg-emerald-950/30",
    text: "text-emerald-400",
    label: "Optimal / Low Hazard",
  };
}
