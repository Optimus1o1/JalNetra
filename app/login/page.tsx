"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  Activity,
  Radio,
  KeyRound,
  Info,
  RefreshCw,
} from "lucide-react";
import { JalNetraLogo } from "@/components/brand/JalNetraLogo";

type ClearanceLevel = "lvl1" | "lvl2" | "lvl3";

interface AuditLogItem {
  id: string;
  timestamp: string;
  type: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  actor: string;
  details: string;
}

const DEFAULT_CREDENTIALS: Record<ClearanceLevel, { callSign: string; passcode: string }> = {
  lvl1: { callSign: "OBS-7041", passcode: "Observer@Jal2026" },
  lvl2: { callSign: "KMC-HYD-40892", passcode: "Hydro#Delta2026" },
  lvl3: { callSign: "CMD-KMC-001", passcode: "Commander!KMC2026" },
};

export default function LoginPage() {
  const router = useRouter();
  const [clearance, setClearance] = useState<ClearanceLevel>("lvl2");
  const [callSign, setCallSign] = useState(DEFAULT_CREDENTIALS.lvl2.callSign);
  const [passcode, setPasscode] = useState(DEFAULT_CREDENTIALS.lvl2.passcode);
  const [showPassword, setShowPassword] = useState(false);
  const [bindMac, setBindMac] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSec, setLockoutSec] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Live dual atomic clocks
  const [utcTime, setUtcTime] = useState("18:24:05Z");
  const [istTime, setIstTime] = useState("23:54:05 IST");
  const [countdown, setCountdown] = useState(899); // 14:59

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch("/api/v1/admin/audit?limit=6");
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setAuditLogs(data.logs);
        }
      }
    } catch {
      // ignore in offline/SSR mode
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + "Z");
      setIstTime(
        now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }) + " IST"
      );
      setCountdown((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleClearanceChange = (lvl: ClearanceLevel) => {
    setClearance(lvl);
    setCallSign(DEFAULT_CREDENTIALS[lvl].callSign);
    setPasscode(DEFAULT_CREDENTIALS[lvl].passcode);
    setErrorMessage(null);
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSign,
          passcode,
          clearance,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed.");
        if (data.lockoutActive && data.remainingLockoutSec) {
          setLockoutSec(data.remainingLockoutSec);
        }
        setIsAuthenticating(false);
        fetchAuditLogs();
        return;
      }

      setAuthSuccess(true);
      fetchAuditLogs();
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err) {
      setErrorMessage("Network error connecting to JalNetra authentication gateway.");
      setIsAuthenticating(false);
    }
  };

  const handleEmergencyBypass = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyBypass: true }),
      });

      if (res.ok) {
        setAuthSuccess(true);
        fetchAuditLogs();
        setTimeout(() => {
          router.push("/");
        }, 600);
      } else {
        setErrorMessage("Emergency bypass gateway unavailable.");
        setIsAuthenticating(false);
      }
    } catch {
      setErrorMessage("Emergency bypass network failure.");
      setIsAuthenticating(false);
    }
  };

  const clearanceData = {
    lvl1: {
      name: "LEVEL 1: FIELD OBSERVER",
      scope: "KMC Ward Sump & Sensor Monitoring (Read-Only Telemetry)",
      badge: "OBSERVER CLEARANCE",
    },
    lvl2: {
      name: "LEVEL 2: MUNICIPAL HYDROLOGIST",
      scope: "Canal Sluice Modeling, Runoff Diagnostics & Scenario Engine",
      badge: "HYDROLOGIST CLEARANCE",
    },
    lvl3: {
      name: "LEVEL 3: INCIDENT COMMANDER",
      scope: "Emergency Pump Dispatch, Embankment Interlocks & Admin Seed",
      badge: "COMMAND CLEARANCE",
    },
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. TOP TECHNICAL MASTHEAD */}
      <header className="w-full bg-[#070b16] border-b border-slate-800/80 px-4 py-2.5 text-xs font-mono shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <JalNetraLogo variant="full" size="sm" badgeText="TERMINAL-AUTH" />
            </Link>
            <span className="text-slate-700 hidden md:inline">|</span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              NODE-CCU-HQ-01 // HOOGHLY ESTUARY [22.5726°N 88.3639°E]
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-3 text-[10px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-[#0b1020] border border-slate-800 text-emerald-400 font-semibold">
              TLS 1.3 AES-256 [ACTIVE]
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0b1020] border border-slate-800 text-cyan-400">
              NDMA / KMC GATEWAY [ONLINE]
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0b1020] border border-slate-800 text-amber-400">
              HMAC-SHA256 TOKEN [GUARDED]
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="tabular-nums font-semibold text-slate-200">{istTime}</span>
              <span className="text-slate-600">/</span>
              <span className="tabular-nums text-slate-400">{utcTime}</span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-amber-400 tabular-nums font-semibold">LOCK: {formatCountdown(countdown)}</span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-[11px]"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>EXIT</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. CENTER COMMAND AUTHENTICATION CHASSIS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Telemetry HUD Bracket (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4 font-mono text-xs">
          <div className="p-4 rounded-lg border border-slate-800/90 bg-[#080d19]/90 backdrop-blur-md space-y-3 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-cyan-400" />
                BASIN TELEMETRY // LIVE
              </span>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">HOOGHLY TIDAL STAGE</div>
                <div className="text-sm font-bold text-amber-400 tabular-nums flex items-baseline justify-between">
                  <span>5.42 m MSL</span>
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">SURGE WATCH</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">ALIPORE S-BAND RADAR</div>
                <div className="text-xs font-semibold text-slate-200">
                  2.8 GHz // SWEEP ACTIVE
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">SENTINEL-1 SAR PASS</div>
                <div className="text-xs font-semibold text-cyan-400">T-42m:18s DESCENDING</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">ACTIVE SUMP SENSORS</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  8 / 8 NODES TRANSMITTING
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mission Credentials Card */}
          <div className="p-4 rounded-lg border border-slate-800/90 bg-[#080d19]/90 backdrop-blur-md space-y-2.5 shadow-lg shadow-black/20">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              MISSION CREDENTIALS
            </span>
            <div className="space-y-2 text-[11px] font-mono text-slate-300">
              <div
                onClick={() => handleClearanceChange("lvl1")}
                className="p-1.5 rounded hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-700 transition-colors"
              >
                <div className="text-cyan-400 text-[10px] font-semibold">LVL 1: OBSERVER</div>
                <div className="text-slate-400 text-[10px]">Callsign: <span className="text-white">OBS-7041</span></div>
                <div className="text-slate-500 text-[9px]">Passcode: Observer@Jal2026</div>
              </div>
              <div
                onClick={() => handleClearanceChange("lvl2")}
                className="p-1.5 rounded hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-700 transition-colors"
              >
                <div className="text-cyan-400 text-[10px] font-semibold">LVL 2: HYDROLOGIST (Default)</div>
                <div className="text-slate-400 text-[10px]">Callsign: <span className="text-white">KMC-HYD-40892</span></div>
                <div className="text-slate-500 text-[9px]">Passcode: Hydro#Delta2026</div>
              </div>
              <div
                onClick={() => handleClearanceChange("lvl3")}
                className="p-1.5 rounded hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-700 transition-colors"
              >
                <div className="text-cyan-400 text-[10px] font-semibold">LVL 3: COMMANDER</div>
                <div className="text-slate-400 text-[10px]">Callsign: <span className="text-white">CMD-KMC-001</span></div>
                <div className="text-slate-500 text-[9px]">Passcode: Commander!KMC2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Login Console Chassis (6 Cols) */}
        <div className="lg:col-span-6 max-w-xl mx-auto w-full">
          <div className="relative rounded-xl border border-slate-800/90 bg-[#080d19]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Header Lockup with Brand Logo */}
            <div className="text-center space-y-3 border-b border-slate-800 pb-5">
              <div className="flex justify-center">
                <JalNetraLogo variant="mark" size="lg" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wider text-white font-sans">
                  JalNetra Global v2.0
                </h2>
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                  MISSION OPERATIONS ACCESS & CLEARANCE PORTAL
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Restricted Multi-Agency Hydrological & Disaster Intelligence Console
                </p>
              </div>
            </div>

            {/* Error / Alert Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-rose-200">AUTHENTICATION REJECTED</div>
                  <div className="text-[11px] leading-relaxed text-rose-300">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Clearance Tier Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <span>SECURITY CLEARANCE TIER</span>
                <span className="text-cyan-400 font-semibold">{clearanceData[clearance].badge}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#050811] border border-slate-800">
                {(["lvl1", "lvl2", "lvl3"] as ClearanceLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleClearanceChange(lvl)}
                    className={`px-2 py-2 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      clearance === lvl
                        ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    {lvl === "lvl1" ? "LVL 1 OBSERVER" : lvl === "lvl2" ? "LVL 2 HYDROLOGIST" : "LVL 3 COMMAND"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-400 pt-0.5 px-0.5">
                {clearanceData[clearance].scope}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleAuthenticate} className="space-y-4">
              {/* Operator Call Sign */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  OPERATOR CALL SIGN / GOV EMPLOYEE ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={callSign}
                    onChange={(e) => setCallSign(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-md bg-[#050811] border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Cryptographic Passcode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    CRYPTOGRAPHIC SECURITY PASSCODE
                  </label>
                  <span className="text-[9px] font-mono text-slate-500">TIMING-SAFE HMAC</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-md bg-[#050811] border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Two-Factor Hardware Key */}
              <div className="p-3 rounded-md bg-[#060a15] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                    HARDWARE SECURITY TOKEN
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    [AUTODETECTED]
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-200">
                  <span className="text-[11px] truncate">YubiKey 5 NFC / CAC Token: ID-77189</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
              </div>

              {/* Session Security Options */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bindMac}
                    onChange={(e) => setBindMac(e.target.checked)}
                    className="rounded border-slate-800 bg-[#050811] text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Bind session to MAC (00:1A:2B:3C:4D:5E)</span>
                </label>
              </div>

              {/* Primary Action CTA Button */}
              <button
                type="submit"
                disabled={isAuthenticating || authSuccess}
                className="w-full py-3 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    VERIFYING CRYPTOGRAPHIC TOKEN...
                  </>
                ) : authSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                    AUTHENTICATED // INITIALIZING COCKPIT...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-950" />
                    AUTHENTICATE & ACCESS MISSION TERMINAL
                  </>
                )}
              </button>
            </form>

            {/* Emergency Disaster Protocol Banner */}
            <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                EMERGENCY DISASTER PROTOCOL OVERRIDE
              </div>
              <p className="text-[10px] font-mono text-slate-300 leading-relaxed">
                During Cyclone / High-Tide Embankment Breach conditions, operators may execute NDRF fast-bypass authentication.
              </p>
              <button
                type="button"
                onClick={handleEmergencyBypass}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-300 underline font-semibold hover:text-rose-200 transition-colors pt-0.5 cursor-pointer disabled:opacity-50"
              >
                <span>[EXECUTE NDRF EMERGENCY COCKPIT BYPASS →]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Security Audit Telemetry Bracket (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4 font-mono text-xs">
          <div className="p-4 rounded-lg border border-slate-800/90 bg-[#080d19]/90 backdrop-blur-md space-y-3 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                LIVE SECURITY AUDIT LOG
              </span>
              <button
                onClick={fetchAuditLogs}
                title="Refresh audit logs"
                className="text-slate-500 hover:text-cyan-400 cursor-pointer p-0.5"
              >
                <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="space-y-2 text-[10px]">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 italic py-2">No security events recorded.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800/40 pb-1.5 last:border-none">
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span className="text-slate-500">
                        {log.timestamp ? log.timestamp.substring(11, 19) + "Z" : "00:00:00Z"}
                      </span>
                      <span
                        className={`px-1 rounded text-[8px] font-bold ${
                          log.severity === "CRITICAL"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : log.severity === "WARN"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {log.type}
                      </span>
                    </div>
                    <div className="text-slate-300 leading-tight line-clamp-2">
                      <span className="text-cyan-400 font-semibold">{log.actor}:</span> {log.details}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-800/90 bg-[#080d19]/90 backdrop-blur-md space-y-2.5 shadow-lg shadow-black/20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-1.5">
              EMERGENCY SUPPORT
            </span>
            <div className="space-y-1.5 text-[10px] text-slate-300">
              <div>KMC Disaster Room: +91 (033) 2286-1212</div>
              <div>Secure Ext: 4401 // VHF Ch: 16</div>
              <div>State Control Desk: Nabanna 1070</div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM TELEMETRY FOOTER */}
      <footer className="w-full bg-[#04060d] border-t border-slate-800/80 py-3 px-4 text-[10px] font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            GOV OF WEST BENGAL & KMC FLOOD FORECASTING INITIATIVE // IMD ALIPORE // NASA GPM // SENTINEL-1 SAR
          </div>
          <div className="text-slate-400">
            HMAC-SHA256 SESSION INTEGRITY ACTIVE // CIPHER SECURITY BASELINE
          </div>
        </div>
      </footer>
    </div>
  );
}
