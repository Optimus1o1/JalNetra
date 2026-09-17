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
        "flex items-center gap-1 p-1 rounded bg-[#090d16] border border-[#1c2638] overflow-x-auto no-scrollbar",
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
              "flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono transition-all duration-150 shrink-0 cursor-pointer",
              isActive
                ? "bg-[#142032] text-sky-300 border border-sky-500/40 font-semibold shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#0e1422] border border-transparent"
            )}
          >
            {tab.icon && (
              <span className={cn("w-3.5 h-3.5", isActive ? "text-sky-400" : "text-slate-500")}>
                {tab.icon}
              </span>
            )}
            <span className="tracking-wide uppercase text-[11px]">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded text-[10px] font-mono",
                  isActive
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-[#162030] text-slate-400"
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
