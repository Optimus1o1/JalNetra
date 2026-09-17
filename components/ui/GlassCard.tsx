import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tone?: "standard" | "elevated" | "accent" | "danger" | "dark";
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  tone = "standard",
  interactive = false,
  ...props
}) => {
  const toneStyles = {
    standard:
      "bg-[rgba(11,18,33,0.78)] border-slate-800/80 shadow-slate-950/50",
    elevated:
      "bg-[rgba(15,23,42,0.88)] border-cyan-500/25 shadow-cyan-950/30",
    accent:
      "bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border-cyan-500/35 shadow-cyan-500/10",
    danger:
      "bg-gradient-to-br from-rose-950/40 to-slate-900/80 border-rose-500/35 shadow-rose-500/10",
    dark:
      "bg-[rgba(5,9,18,0.92)] border-slate-900 shadow-black",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border backdrop-blur-xl transition-all duration-300",
        "shadow-lg",
        "before:absolute before:inset-0 before:rounded-xl before:pointer-events-none before:border-t before:border-white/[0.08]",
        toneStyles[tone],
        interactive &&
          "hover:border-cyan-400/50 hover:shadow-cyan-500/15 hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
