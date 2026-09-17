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
      "bg-[#0d121e]/90 border-[#1c2638] shadow-sm",
    elevated:
      "bg-[#111726]/95 border-[#223048] shadow-sm",
    accent:
      "bg-[#0f192b]/95 border-sky-500/35 shadow-sm",
    danger:
      "bg-[#1c1218]/95 border-rose-500/40 shadow-sm",
    dark:
      "bg-[#080b12]/95 border-[#182030] shadow-sm",
  };

  return (
    <div
      className={cn(
        "relative rounded border transition-all duration-150 corner-bracket",
        "before:absolute before:inset-0 before:rounded before:pointer-events-none before:border-t before:border-white/[0.05]",
        toneStyles[tone],
        interactive &&
          "hover:border-sky-500/40 hover:bg-[#131b2c] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
