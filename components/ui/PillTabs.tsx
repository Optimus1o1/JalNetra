"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

interface PillTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const PillTabs: React.FC<PillTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer",
              isActive
                ? "bg-gradient-to-r from-cyan-950/80 to-slate-900/90 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/50 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
            )}
          >
            {tab.icon && (
              <span className={cn("w-3.5 h-3.5", isActive ? "text-cyan-400" : "text-slate-400")}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
