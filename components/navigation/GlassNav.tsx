"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  UserCheck,
} from "lucide-react";
import { JalNetraLogo } from "@/components/brand/JalNetraLogo";

interface OperatorSession {
  callSign: string;
  clearance: string;
  clearanceName: string;
  badge: string;
  rank: number;
}

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
  const [session, setSession] = useState<OperatorSession | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/v1/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.session) {
            setSession(data.session);
          } else {
            setSession(null);
          }
        }
      } catch {
        // SSR / offline fallback
      }
    }
    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setSession(null);
      router.refresh();
    } catch {
      setSession(null);
    }
  };

  const navItems = [
    { id: "cockpit", label: "Cockpit", icon: LayoutDashboard, href: "/" },
    { id: "global", label: "Global Climate", icon: Globe2, href: "/#global" },
    { id: "rainfall", label: "Rainfall Radar", icon: CloudRain, href: "/#rainfall" },
    { id: "water-twin", label: "Water Twin", icon: Waves, href: "/#water-twin" },
    { id: "vulnerability", label: "Vulnerability", icon: ShieldAlert, href: "/#vulnerability" },
    { id: "simulation", label: "Sim Engine", icon: PlaySquare, href: "/#simulation" },
    { id: "alerts", label: "Alerts", icon: Bell, href: "/#alerts", badge: "3" },
    { id: "models", label: "Model Lab", icon: Cpu, href: "/#models" },
  ];

  const handleNavClick = (id: string) => {
    if (pathname !== "/") {
      router.push(`/#${id}`);
    } else {
      if (onSelectScreen) {
        onSelectScreen(id);
      }
      try {
        window.location.hash = id;
      } catch {
        // ignore in SSR
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#050811]/92 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-5 lg:px-6 py-2 shadow-xl shadow-black/40">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3">
        {/* Brand Lockup with Bespoke JalNetra Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <JalNetraLogo variant="full" size="md" badgeText="OPS-COMMAND" />
            <div className="hidden 2xl:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-[10px] font-mono text-slate-400 whitespace-nowrap">
              <span className="text-slate-500">BASIN-01:</span>
              <span className="text-cyan-400/90 font-medium">HOOGHLY DELTA [22.57°N 88.36°E]</span>
            </div>
          </Link>
        </div>

        {/* Desktop Single-Line Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#090e1b]/95 p-1 rounded-lg border border-slate-800/90 shadow-inner overflow-x-auto scrollbar-none max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-md text-[11px] font-mono transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.18)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-cyan-400" : "text-slate-400")} />
                <span className="uppercase tracking-wide">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shrink-0 ml-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Indicators & Security Authentication */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#090e1b] border border-slate-800 text-[10px] font-mono text-slate-300 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-slate-400">RADAR:</span>
            <span className="text-emerald-400 font-semibold">SWEEP ACTIVE</span>
          </div>

          {session ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#091322] border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-white leading-tight tracking-wide">{session.callSign}</span>
                <span className="text-[8px] text-cyan-400 uppercase tracking-tight font-semibold">
                  {session.clearance.toUpperCase()} // RK-{session.rank}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Terminate Security Session (Logout)"
                className="ml-1 p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer border border-transparent hover:border-rose-800/40"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#090e1b] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 hover:text-cyan-200 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              title="Operator Security Clearance Access"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold tracking-wide">AUTH LOGIN</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md bg-[#090e1b] border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-2 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-left transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-800 border border-slate-800/40"
                )}
              >
                <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
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

