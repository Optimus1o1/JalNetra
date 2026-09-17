"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Globe2,
  CloudRain,
  Waves,
  ShieldAlert,
  PlaySquare,
  Bell,
  Cpu,
  LayoutDashboard,
  Menu,
  X,
  Radio,
  Shield,
} from "lucide-react";
import { Button } from "../ui/Button";

interface GlassNavProps {
  onTriggerSimulation?: () => void;
  activeScreen?: string;
  onSelectScreen?: (screen: string) => void;
}

export const GlassNav: React.FC<GlassNavProps> = ({
  onTriggerSimulation,
  activeScreen = "cockpit",
  onSelectScreen,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { id: "cockpit", label: "Cockpit", icon: LayoutDashboard, href: "/" },
    { id: "global", label: "Global Climate 3D", icon: Globe2, href: "/#global" },
    { id: "rainfall", label: "Rainfall Radar", icon: CloudRain, href: "/#rainfall" },
    { id: "water-twin", label: "Water Twin", icon: Waves, href: "/#water-twin" },
    { id: "vulnerability", label: "Vulnerability", icon: ShieldAlert, href: "/#vulnerability" },
    { id: "simulation", label: "Simulation Engine", icon: PlaySquare, href: "/#simulation" },
    { id: "alerts", label: "Active Alerts", icon: Bell, href: "/#alerts", badge: "3" },
    { id: "models", label: "Model Lab", icon: Cpu, href: "/#models" },
  ];

  const handleNavClick = (id: string) => {
    if (onSelectScreen) {
      onSelectScreen(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080b12]/95 border-b border-[#1c2638] px-4 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-sm bg-[#0e1522] border border-[#23334d] text-sky-400 font-mono font-bold text-sm shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
              JN
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-sky-200 transition-colors font-sans uppercase">
                  JALNETRA
                </span>
                <span className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-[#142032] text-sky-300 border border-sky-500/30">
                  OPS-COMMAND
                </span>
                <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                  v2.0 // BASIN-01
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider hidden sm:block">
                HOOGHLY DELTA & GREATER KOLKATA [22.5726°N 88.3639°E]
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-[#090d16] p-0.5 rounded border border-[#1c2638]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-[#142032] text-sky-300 border border-sky-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#0e1422] border border-transparent"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-sky-400" : "text-slate-500")} />
                <span className="uppercase text-[11px] tracking-wide">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded bg-[#0b101a] border border-[#1c2638] text-[10px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">RADAR:</span>
            <span className="text-emerald-400 font-semibold">SWEEP ACTIVE</span>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#0e1422] hover:bg-[#141e30] border border-[#1c2638] hover:border-sky-500/40 text-[10px] font-mono text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
            title="Operator Security Clearance Access"
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">AUTH /</span> LOGIN
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded bg-[#0e1422] border border-[#1c2638] text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-800"
                )}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
