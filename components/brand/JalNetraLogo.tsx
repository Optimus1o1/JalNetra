"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface JalNetraLogoProps {
  variant?: "mark" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

export const JalNetraLogo: React.FC<JalNetraLogoProps> = ({
  variant = "full",
  size = "md",
  showBadge = true,
  badgeText = "v2.0 // OPS",
  className,
}) => {
  // Dimension tokens
  const sizeMap = {
    sm: { icon: 26, text: "text-xs", badge: "text-[9px] px-1 py-0.2" },
    md: { icon: 34, text: "text-sm", badge: "text-[10px] px-1.5 py-0.5" },
    lg: { icon: 46, text: "text-lg", badge: "text-[11px] px-2 py-0.5" },
    xl: { icon: 64, text: "text-2xl", badge: "text-xs px-2.5 py-1" },
  };

  const { icon, text, badge } = sizeMap[size] || sizeMap.md;

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none shrink-0", className)}>
      {/* Precision Vector Emblem: Jal (Wave) + Netra (Sentinel Eye) */}
      <div
        className="relative flex items-center justify-center shrink-0 group"
        style={{ width: icon, height: icon }}
      >
        {/* Ambient Glow Backdrop */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-500/10 to-emerald-500/20 blur-[5px] group-hover:blur-[8px] transition-all duration-300" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
        >
          <defs>
            {/* Linear & Radial Gradients */}
            <linearGradient id="jn-aperture-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <linearGradient id="jn-wave-grad-1" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="jn-wave-grad-2" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0369a1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>

            <radialGradient id="jn-iris-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#0f172a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Outer Cybernetic Reticle Ring */}
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="opacity-70"
          />

          {/* 2. Cardinal Tick Marks */}
          <line x1="50" y1="2" x2="50" y2="8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="92" x2="50" y2="98" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="50" x2="8" y2="50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="92" y1="50" x2="98" y2="50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

          {/* 3. Sensor Eye (Netra) Outer Aperture Arcs */}
          <path
            d="M 12 50 C 26 24, 74 24, 88 50 C 74 76, 26 76, 12 50 Z"
            stroke="url(#jn-aperture-grad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
          />

          {/* 4. Secondary Concentric Iris Aperture */}
          <ellipse
            cx="50"
            cy="50"
            rx="24"
            ry="24"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            className="opacity-60"
          />

          {/* 5. Hydrodynamic Flow Waves (Jal) through Central Iris */}
          <path
            d="M 20 54 C 32 42, 42 62, 56 48 C 66 38, 76 52, 84 46"
            stroke="url(#jn-wave-grad-1)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 18 46 C 30 58, 44 38, 58 52 C 68 62, 78 48, 86 54"
            stroke="url(#jn-wave-grad-2)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* 6. Central Sensor Iris Core (Netra Pupil & Sonar Beacon) */}
          <circle cx="50" cy="50" r="11" fill="url(#jn-iris-glow)" />
          <circle
            cx="50"
            cy="50"
            r="6"
            fill="#06b6d4"
            className="drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
          />
          <circle cx="50" cy="50" r="2.5" fill="#f8fafc" />

          {/* 7. Active Telemetry Beacon Dot (Top Right) */}
          <circle
            cx="76"
            cy="26"
            r="3.5"
            fill="#10b981"
            className="animate-pulse drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]"
          />
        </svg>
      </div>

      {/* Brand Typography & Operational Clearance Badge (when variant="full") */}
      {variant === "full" && (
        <div className="flex flex-col justify-center shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-extrabold tracking-wider text-white uppercase font-sans leading-none",
                text
              )}
            >
              JalNetra
            </span>

            {showBadge && (
              <span
                className={cn(
                  "rounded font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 tracking-wider uppercase shrink-0 whitespace-nowrap",
                  badge
                )}
              >
                {badgeText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
