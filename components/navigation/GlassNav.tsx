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
    { id: "global", label: "Global Climate", icon: Globe2, href: "/#global" },
    { id: "rainfall", label: "Rainfall Intelligence", icon: CloudRain, href: "/#rainfall" },
    { id: "water-twin", label: "Water Twin", icon: Waves, href: "/#water-twin" },
    { id: "vulnerability", label: "Vulnerability", icon: ShieldAlert, href: "/#vulnerability" },
    { id: "simulation", label: "What-If Simulator", icon: PlaySquare, href: "/#simulation" },
    { id: "alerts", label: "Alerts", icon: Bell, href: "/#alerts", badge: "2" },
    { id: "models", label: "Model Lab", icon: Cpu, href: "/#models" },
  ];

  const handleNavClick = (id: string) => {
    if (onSelectScreen) {
      onSelectScreen(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-hud border-b border-cyan-500/20 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 via-slate-900 to-blue-900/60 border border-cyan-400/50 shadow-lg shadow-cyan-500/20 group-hover:border-cyan-300 transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
              <div className="absolute inset-0 rounded-xl border border-cyan-400/20 pointer-events-none" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors font-sans">
                  JALNETRA
                </span>
                <span className="text-xs px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  GLOBAL
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-cyan-400/80 font-mono tracking-wider hidden sm:block">
                CLIMATE, RAINFALL & WATER DIGITAL TWIN
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-cyan-400" : "text-slate-400")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>LIVE TWIN</span>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={<PlaySquare className="w-3.5 h-3.5" />}
            onClick={() => {
              if (onTriggerSimulation) {
                onTriggerSimulation();
              } else if (onSelectScreen) {
                onSelectScreen("simulation");
              }
            }}
          >
            <span className="hidden sm:inline">What-If</span> Simulator
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 pb-2">
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
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
