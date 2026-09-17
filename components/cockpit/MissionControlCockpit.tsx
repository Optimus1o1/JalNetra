"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Radio,
  Search,
  Activity,
  Waves,
  AlertTriangle,
  Play,
  Pause,
  Lock,
  Layers,
  Sliders,
  CheckCircle2,
  Maximize2,
  Clock,
  Compass,
  ArrowRight,
  Shield,
  Zap,
  Cpu,
  Box,
} from "lucide-react";
import { runSimulationScenario } from "@/lib/simulationEngine";
import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { Hydrograph3D } from "@/components/3d/Hydrograph3D";
import { TacticalGlobeOverlay3D } from "@/components/3d/TacticalGlobeOverlay3D";

interface MissionControlCockpitProps {
  onSelectWard?: (wardNumber: number) => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const MissionControlCockpit: React.FC<MissionControlCockpitProps> = ({
  onSelectWard,
  onNavigateToSection,
}) => {
  // 3D Visualization Modes
  const [hydrographMode, setHydrographMode] = useState<"2d" | "3d">("3d");
  const [mapMode, setMapMode] = useState<"2d" | "3d">("2d");

  // 1. Search & Sector Filtering
  const [filterQuery, setFilterQuery] = useState("");

  // 2. Tactical GIS Layers & Alpha
  const [layers, setLayers] = useState({
    vectors: true,
    bathymetry: true,
    siltation: true,
    runoff: false,
    radar: true,
  });
  const [layerAlpha, setLayerAlpha] = useState(75);

  // 3. Interactive Map Reticle Hover/Click Coordinates
  const [reticle, setReticle] = useState({
    name: "WARD 66: TOPSIA",
    lat: "22.541°N",
    lon: "88.398°E",
    elev: "+3.10m MSL",
    infilt: "12.4 mm/h",
    salinity: "4.8 ppt",
    status: "CRITICAL SILT",
  });

  // 4. Nowcast Hydrograph Timeline Scrubber
  const [scrubIndex, setScrubIndex] = useState(4); // 0 to 8 (4 = T_0 NOW)
  const [isPlaying, setIsPlaying] = useState(false);

  const timeSlices = [
    { label: "-12h", time: "06:14" },
    { label: "-9h", time: "09:14" },
    { label: "-6h", time: "12:14" },
    { label: "-3h", time: "15:14" },
    { label: "T_0 NOW", time: "18:14" },
    { label: "+3h", time: "21:14" },
    { label: "+6h", time: "00:14" },
    { label: "+9h", time: "03:14" },
    { label: "+12h", time: "06:14" },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setScrubIndex((prev) => (prev + 1) % timeSlices.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, timeSlices.length]);

  // 5. Interactive Tactical Dispatch Sliders
  const [rainfallRate, setRainfallRate] = useState(45); // mm/h
  const [siltDredge, setSiltDredge] = useState(35); // %
  const [turbines, setTurbines] = useState(8); // 1 to 12
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchExecuted, setDispatchExecuted] = useState(false);

  // Sluice 4 Interlock State
  const [sluice4Locked, setSluice4Locked] = useState(false);

  // Dynamic Physics Outcome Calculation
  const simulationOutcome = useMemo(() => {
    // Residual head: base 2.45m + (rain - 30)*0.03 - (dredge * 0.015) - (turbines * 0.08)
    const baseDepth = 2.45;
    const rainDelta = (rainfallRate - 30) * 0.025;
    const dredgeRelief = (siltDredge / 100) * 0.55;
    const turbineRelief = ((turbines - 4) / 8) * 0.65;
    const netHead = baseDepth + rainDelta - dredgeRelief - turbineRelief;
    const retentionHours = Math.max(1.5, (4.8 - (turbines * 0.25) - (siltDredge * 0.02))).toFixed(1);
    const averted = netHead < 2.8;

    return {
      residualHead: (netHead - 2.80).toFixed(2), // relative to crest
      waterLevel: Math.max(1.2, netHead).toFixed(2),
      retentionHours,
      averted,
    };
  }, [rainfallRate, siltDredge, turbines]);

  const handleExecuteDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchExecuted(true);
      setTimeout(() => setDispatchExecuted(false), 4000);
    }, 800);
  };

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Filtered basin sectors for left rail
  const sectors = [
    {
      id: "w66",
      wardNumber: 66,
      name: "Ward 66: Topsia / EM Bypass",
      coords: "LAT 22.541°N // LON 88.398°E",
      status: "CRITICAL SILT",
      statusTone: "rose",
      depth: "2.45m",
      delta: "+0.35m/h",
      discharge: "42.1 m³/s",
      silt: "68%",
      sluice: "85% OPEN",
      sparkColor: "#ef4444",
      sparkPath: "M0,16 L20,14 L40,15 L60,10 L80,6 L100,2",
    },
    {
      id: "w131",
      wardNumber: 131,
      name: "Ward 131: Taratala / Behala",
      coords: "DIAMOND HARBOUR RD CORRIDOR",
      status: "ADVISORY",
      statusTone: "amber",
      depth: "1.82m",
      delta: "+0.12m/h",
      discharge: "28.4 m³/s",
      silt: "45%",
      sluice: "100% OPEN",
      sparkColor: "#f59e0b",
      sparkPath: "M0,12 L20,11 L40,13 L60,11 L80,9 L100,8",
    },
    {
      id: "w107",
      wardNumber: 107,
      name: "Ward 107: Kasba / Ruby",
      coords: "EAST KOLKATA WETLAND FLANK",
      status: "NOMINAL",
      statusTone: "emerald",
      depth: "2.10m",
      delta: "+0.05m/h",
      discharge: "31.0 m³/s",
      silt: "58%",
      sluice: "60% OPEN",
      sparkColor: "#10b981",
      sparkPath: "M0,10 L20,10 L40,9 L60,11 L80,10 L100,10",
    },
    {
      id: "bagjola",
      wardNumber: 1,
      name: "Bagjola Canal Siphon",
      coords: "PRIMARY NORTH ARTERY // 38.2 KM",
      status: "CHOKE 72%",
      statusTone: "amber",
      depth: "3.10m",
      delta: "Velocity 1.85 m/s",
      discharge: "74.0 m³/s",
      silt: "72%",
      sluice: "4/6 Turbines Active",
      sparkColor: "#f59e0b",
      sparkPath: "M0,14 L20,12 L40,14 L60,8 L80,6 L100,5",
    },
    {
      id: "hooghly",
      wardNumber: 75,
      name: "Hooghly River Mainstem",
      coords: "GARDEN REACH TIDAL STATION",
      status: "SURGE APPROACH",
      statusTone: "sky",
      depth: "+2.95m MSL",
      delta: "Apogee in +1h 14m",
      discharge: "2,410 m³/s",
      silt: "38%",
      sluice: "Flood Gate Armed",
      sparkColor: "#38bdf8",
      sparkPath: "M0,16 L20,13 L40,9 L60,4 L80,2 L100,1",
    },
  ];

  const filteredSectors = sectors.filter(
    (s) =>
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.coords.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col bg-[#070b13] text-slate-100 border border-[#1c2638] rounded overflow-hidden shadow-2xl corner-bracket">
      {/* ======================================================== */}
      {/* 1. DENSE MISSION METRICS SUB-BAR                         */}
      {/* ======================================================== */}
      <div className="w-full bg-[#080d16] border-b border-[#1c2638] px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500">INSAT-3DR:</span>
            <span className="text-emerald-400 font-medium">NOMINAL (12m delay)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500">GPM IMERG:</span>
            <span className="text-slate-200 font-medium">SYNCED</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-slate-500">SENTINEL-1 SAR:</span>
            <span className="text-sky-300 font-medium">PASS 04:18Z (+38m)</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500">ALIPORE S-BAND:</span>
            <span className="text-slate-300">2.8 GHz // R-MAX 250km</span>
            <span className="px-1 py-0.2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[9px]">
              SWEEP ACTIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">SILT AGG:</span>
            <span className="text-amber-400 font-semibold tabular-nums">54.2%</span>
            <span className="px-1 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[9px]">
              ELEVATED
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">RISK INDEX:</span>
            <span className="text-rose-400 font-bold tabular-nums">64.2 / 100</span>
            <span className="px-1 py-0.2 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30 text-[9px]">
              ADVISORY
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN TACTICAL WORKSTATION (3-COLUMN DOCK)             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[640px] items-stretch">
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: TACTICAL STATION TELEMETRY RAIL (3/12)    */}
        {/* ------------------------------------------------------ */}
        <aside className="xl:col-span-3 bg-[#0a0f1a] border-r border-[#1c2638] flex flex-col justify-between">
          {/* Rail Header */}
          <div className="p-3 border-b border-[#1c2638] bg-[#070b13] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-sky-400 tracking-wider uppercase font-mono">
                  SECTOR DELTA-09
                </div>
                <div className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase">
                  SYS_STAT: NOMINAL // 100Hz
                </div>
              </div>
              <button
                onClick={() => setSluice4Locked(!sluice4Locked)}
                className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                  sluice4Locked
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold"
                    : "bg-[#142032] text-sky-300 border-sky-500/40 hover:bg-sky-500 hover:text-black"
                }`}
              >
                {sluice4Locked ? "SLUICE 4 ARMED" : "INITIATE LOCK"}
              </button>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="FILTER WARD, CANAL, GAUGE..."
                className="w-full bg-[#070a10] border border-[#1c2638] rounded-xs pl-7 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Sector Telemetry Cards Stack */}
          <div className="p-2.5 space-y-2 overflow-y-auto max-h-[500px]">
            {filteredSectors.map((sec) => (
              <div
                key={sec.id}
                onClick={() => {
                  if (onSelectWard) onSelectWard(sec.wardNumber);
                  setReticle({
                    name: sec.name.toUpperCase(),
                    lat: "22.541°N",
                    lon: "88.398°E",
                    elev: sec.depth,
                    infilt: sec.discharge,
                    salinity: sec.silt,
                    status: sec.status,
                  });
                }}
                className={`p-2.5 rounded-sm bg-[#0e1422] border transition-all cursor-pointer hover:border-sky-500/50 ${
                  sec.statusTone === "rose"
                    ? "border-l-2 border-l-rose-500 border-[#1c2638]"
                    : sec.statusTone === "amber"
                    ? "border-l-2 border-l-amber-500 border-[#1c2638]"
                    : "border-l-2 border-l-emerald-500 border-[#1c2638]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">{sec.name}</h5>
                    <p className="text-[9px] font-mono text-slate-500">{sec.coords}</p>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
                      sec.statusTone === "rose"
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        : sec.statusTone === "amber"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {sec.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#182234] text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">DEPTH</span>
                    <span className="font-semibold text-slate-200">
                      {sec.depth} <span className="text-slate-500 text-[9px]">({sec.delta})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">DISCHARGE</span>
                    <span className="font-semibold text-slate-200">{sec.discharge}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SILTATION</span>
                    <span className="font-semibold text-amber-400">{sec.silt}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SLUICE</span>
                    <span className="font-semibold text-sky-400">{sec.sluice}</span>
                  </div>
                </div>

                {/* Micro Sparkline */}
                <div className="mt-2 h-4 w-full bg-[#080d16] rounded-xs flex items-center px-1">
                  <svg className="w-full h-3 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
                    <path
                      d={sec.sparkPath}
                      fill="none"
                      stroke={sec.sparkColor}
                      strokeWidth="1.5"
                    />
                    <circle cx="100" cy="2" r="2" fill={sec.sparkColor} className="animate-pulse" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* SideNav Footer */}
          <div className="p-2 border-t border-[#1c2638] bg-[#070b13] flex items-center justify-around text-[10px] font-mono text-slate-400">
            <button
              onClick={() => onNavigateToSection && onNavigateToSection("models")}
              className="hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Cpu className="w-3 h-3 text-sky-400" />
              <span>Model Lab</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => onNavigateToSection && onNavigateToSection("alerts")}
              className="hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Alerts (2)</span>
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------ */}
        {/* CENTER COLUMN: GIS TWIN & 24H NOWCAST SCRUBBER (6/12) */}
        {/* ------------------------------------------------------ */}
        <main className="xl:col-span-6 bg-[#070a0f] flex flex-col justify-between relative overflow-hidden border-r border-[#1c2638]">
          {/* GIS Layer Controls Bar */}
          <div className="bg-[#080e18] border-b border-[#1c2638] p-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 mr-1 uppercase">LAYERS:</span>
              <button
                onClick={() => toggleLayer("vectors")}
                className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
                  layers.vectors
                    ? "bg-[#142338] text-sky-300 border-sky-500/50 font-bold"
                    : "bg-[#0c111c] text-slate-500 border-[#1c2638]"
                }`}
              >
                VECTORS
              </button>
              <button
                onClick={() => toggleLayer("bathymetry")}
                className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
                  layers.bathymetry
                    ? "bg-[#142338] text-sky-300 border-sky-500/50 font-bold"
                    : "bg-[#0c111c] text-slate-500 border-[#1c2638]"
                }`}
              >
                BATHYMETRY
              </button>
              <button
                onClick={() => toggleLayer("siltation")}
                className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
                  layers.siltation
                    ? "bg-amber-950/40 text-amber-300 border-amber-500/50 font-bold"
                    : "bg-[#0c111c] text-slate-500 border-[#1c2638]"
                }`}
              >
                SILTATION
              </button>
              <button
                onClick={() => toggleLayer("radar")}
                className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
                  layers.radar
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/50 font-bold"
                    : "bg-[#0c111c] text-slate-500 border-[#1c2638]"
                }`}
              >
                RADAR dBZ
              </button>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              {/* Map 2D / 3D Toggle */}
              <div className="flex items-center gap-1 bg-[#050811] border border-[#1c2638] p-0.5 rounded text-[9px] font-mono mr-1">
                <button
                  type="button"
                  onClick={() => setMapMode("2d")}
                  className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${
                    mapMode === "2d"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  2D VECTOR
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("3d")}
                  className={`px-2 py-0.5 rounded-xs transition-all flex items-center gap-1 cursor-pointer ${
                    mapMode === "3d"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Box className="w-2.5 h-2.5 text-sky-400" />
                  <span>3D TWIN</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>ALPHA:</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={layerAlpha}
                  onChange={(e) => setLayerAlpha(Number(e.target.value))}
                  className="w-14 h-1 accent-sky-400 cursor-pointer"
                />
                <span className="text-sky-400 w-6">{layerAlpha}%</span>
              </div>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline text-slate-400">EPSG:3857</span>
            </div>
          </div>

          {/* Master Vector GIS Twin (2D SVG or 3D WebGL) */}
          {mapMode === "3d" ? (
            <div className="relative flex-1 min-h-[380px] bg-[#06090f] overflow-hidden">
              <TacticalGlobeOverlay3D onSelectWard={onSelectWard} />
            </div>
          ) : (
            <div className="relative flex-1 min-h-[380px] bg-[#06090f] overflow-hidden flex items-center justify-center">
              {/* Coordinate Grid Overlay */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />

            <svg
              className="w-full h-full cursor-crosshair select-none"
              viewBox="0 0 900 600"
              preserveAspectRatio="xMidYMid meet"
              style={{ opacity: layerAlpha / 100 }}
            >
              <defs>
                <linearGradient id="cockpitHooghlyGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
                </linearGradient>

                <pattern id="breachHatchCockpit" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.45" />
                </pattern>

                <pattern id="amberHatchCockpit" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.35" />
                </pattern>
              </defs>

              {/* Ward 66 (Critical Red Hatch - EM Bypass / Topsia) */}
              <polygon
                points="520,290 610,270 630,340 570,380 500,340"
                fill="url(#breachHatchCockpit)"
                stroke="#ef4444"
                strokeWidth="1.8"
                className="hover:fill-rose-500/20 transition-colors cursor-pointer"
                onClick={() => onSelectWard && onSelectWard(66)}
              />
              <text x="535" y="325" fill="#fca5a5" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">
                WARD 66 [INUNDATION 88%]
              </text>

              {/* Ward 107 (Kasba / Ruby - Amber Hatch) */}
              <polygon
                points="570,385 660,350 690,430 620,460 550,420"
                fill="url(#amberHatchCockpit)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                className="hover:fill-amber-500/20 transition-colors cursor-pointer"
                onClick={() => onSelectWard && onSelectWard(107)}
              />
              <text x="580" y="415" fill="#fed7aa" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">
                WARD 107 [WATERLOG 62%]
              </text>

              {/* Ward 131 (Taratala / Behala - Amber Hatch) */}
              <polygon
                points="340,390 420,380 440,460 360,490 320,430"
                fill="url(#amberHatchCockpit)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                className="hover:fill-amber-500/20 transition-colors cursor-pointer"
                onClick={() => onSelectWard && onSelectWard(131)}
              />
              <text x="345" y="440" fill="#fed7aa" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600">
                WARD 131 [SURGE 54%]
              </text>

              {/* East Kolkata Wetlands (Ramsar Retention Zone) */}
              <path
                d="M640,230 Q720,260 760,330 T730,460 Q660,450 635,360 Z"
                fill="#052e16"
                fillOpacity="0.4"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />
              <text x="655" y="300" fill="#6ee7b7" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">
                EAST KOLKATA WETLANDS (RAMSAR #1208)
              </text>
              <text x="655" y="315" fill="#34d399" fontFamily="Inter" fontSize="8">
                SPILL STORAGE: 78.4 MCM
              </text>

              {/* HOOGHLY RIVER TIDAL REACH (Curved Polyline with Bathymetry depth) */}
              <path
                d="M360,20 C340,80 320,150 340,210 C360,280 390,320 340,400 C290,480 260,540 240,600"
                fill="none"
                stroke="url(#cockpitHooghlyGradient)"
                strokeWidth="32"
                strokeLinecap="round"
              />
              <path
                d="M360,20 C340,80 320,150 340,210 C360,280 390,320 340,400 C290,480 260,540 240,600"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="8,6"
                className="flow-line"
              />
              <text x="270" y="100" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" letterSpacing="1.5">
                HOOGHLY RIVER (BHAGIRATHI-GANGES)
              </text>
              <text x="270" y="115" fill="#94a3b8" fontFamily="Inter" fontSize="8">
                TIDAL REACH // FLOW: 2,410 m³/s
              </text>

              {/* Canals */}
              {/* Circular Canal */}
              <path d="M350,160 Q440,150 510,190 T560,240" fill="none" stroke="#0284c7" strokeWidth="4" />
              <text x="440" y="180" fill="#7dd3fc" fontFamily="JetBrains Mono" fontSize="8">
                CIRCULAR CANAL
              </text>

              {/* Bagjola Canal */}
              <path
                d="M350,70 Q480,80 580,120 T720,140"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="5"
                strokeDasharray="8,4"
                className="flow-line"
              />
              <text x="510" y="105" fill="#fcd34d" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600">
                BAGJOLA CANAL (SILT CHOKE 72%)
              </text>

              {/* Tolly's Nullah */}
              <path
                d="M360,350 Q430,370 480,450 T540,560"
                fill="none"
                stroke="#0284c7"
                strokeWidth="4"
                strokeDasharray="6,4"
                className="flow-line"
              />
              <text x="410" y="420" fill="#7dd3fc" fontFamily="JetBrains Mono" fontSize="8">
                TOLLY'S NULLAH (ADI GANGA)
              </text>

              {/* Sluice Gate Nodes */}
              {/* Sluice 4 */}
              <rect
                x="352"
                y="342"
                width="16"
                height="16"
                fill={sluice4Locked ? "#10b981" : "#ef4444"}
                stroke="#ffffff"
                strokeWidth="2"
                className="animate-pulse cursor-pointer"
                onClick={() => setSluice4Locked(!sluice4Locked)}
              />
              <text x="210" y="346" fill="#fca5a5" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700">
                SLUICE-04 [{sluice4Locked ? "LOCKED INTERLOCK" : "CLOSING IN 28m"}]
              </text>

              {/* Sluice 7 */}
              <rect x="310" y="415" width="16" height="16" fill="#0c1322" stroke="#10b981" strokeWidth="2" />
              <text x="215" y="425" fill="#6ee7b7" fontFamily="JetBrains Mono" fontSize="8">
                SLUICE-07 [GARDEN REACH]
              </text>

              {/* Interactive GIS Crosshair Reticle */}
              <g transform="translate(545, 325)">
                <circle cx="0" cy="0" r="26" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,2" />
                <line x1="-34" y1="0" x2="34" y2="0" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="0" y1="-34" x2="0" y2="34" stroke="#38bdf8" strokeWidth="1.2" />

                {/* Reticle HUD Box */}
                <rect x="32" y="-36" width="170" height="72" rx="2" fill="#080e1a" fillOpacity="0.94" stroke="#38bdf8" strokeWidth="1" />
                <text x="40" y="-22" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700">
                  RETICLE: {reticle.name}
                </text>
                <text x="40" y="-10" fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="8">
                  LAT: {reticle.lat} | LON: {reticle.lon}
                </text>
                <text x="40" y="2" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="8">
                  ELEV: {reticle.elev}
                </text>
                <text x="40" y="14" fill="#10b981" fontFamily="JetBrains Mono" fontSize="8">
                  INFILTRATION: {reticle.infilt}
                </text>
                <text x="40" y="26" fill="#ef4444" fontFamily="JetBrains Mono" fontSize="8">
                  SALINITY: {reticle.salinity}
                </text>
              </g>

              {/* Alipore Doppler Tower Sweep Cone */}
              {layers.radar && (
                <>
                  <path
                    d="M420,290 L260,110 A240,240 0 0,1 590,130 Z"
                    fill="#38bdf8"
                    fillOpacity="0.08"
                    stroke="#38bdf8"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                  <line x1="420" y1="290" x2="480" y2="105" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
                  <circle cx="420" cy="290" r="4" fill="#38bdf8" />
                  <text x="430" y="302" fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="8">
                    ALIPORE DOPPLER TOWER
                  </text>
                </>
              )}
            </svg>

            {/* Bathymetric Legend */}
            <div className="absolute bottom-2 left-2 bg-[#080d16]/95 p-2 rounded-xs border border-[#1c2638] text-[9px] font-mono">
              <div className="text-slate-400 mb-1 uppercase">BATHYMETRY (MSL)</div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#0284c7]" /> -12m
                <span className="w-2.5 h-2.5 bg-[#06b6d4] ml-1" /> -6m
                <span className="w-2.5 h-2.5 bg-[#10b981] ml-1" /> 0m
                <span className="w-2.5 h-2.5 bg-[#f59e0b] ml-1" /> +2m
                <span className="w-2.5 h-2.5 bg-[#ef4444] ml-1" /> +4m
              </div>
            </div>

            {/* Compass Scale */}
            <div className="absolute top-2 right-2 bg-[#080d16]/95 px-2.5 py-1.5 rounded-xs border border-[#1c2638] flex items-center gap-2 text-[9px] font-mono">
              <div className="w-5 h-5 rounded-full border border-sky-400/50 flex items-center justify-center font-bold text-sky-400">
                N
              </div>
              <div>
                <div className="text-slate-200">FOV: 14.8km × 9.2km</div>
                <div className="text-slate-500">SCALE: 1:25,000</div>
              </div>
            </div>
          </div>
          )}

          {/* ==================================================== */}
          {/* BOTTOM 24-HOUR NOWCAST HYDROGRAPH & RADAR SCRUBBER   */}
          {/* ==================================================== */}
          <div className="bg-[#090e18] border-t border-[#1c2638] p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 font-bold uppercase">
                  [SEC_05 // HYDROGRAPH NOWCAST & RADAR QPE SCRUBBER]
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  T-12H REASSESSMENT → T+12H PREDICTIVE RUNOFF
                </span>
              </div>

              {/* View Switcher: 2D vs 3D */}
              <div className="flex items-center gap-1 bg-[#050811] border border-[#1c2638] p-0.5 rounded text-[9px] font-mono">
                <button
                  type="button"
                  onClick={() => setHydrographMode("2d")}
                  className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${
                    hydrographMode === "2d"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  2D DUAL-AXIS
                </button>
                <button
                  type="button"
                  onClick={() => setHydrographMode("3d")}
                  className={`px-2 py-0.5 rounded-xs transition-all flex items-center gap-1 cursor-pointer ${
                    hydrographMode === "3d"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Box className="w-2.5 h-2.5 text-sky-400" />
                  <span>3D VOLUMETRIC</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-sky-400" />
                  <span className="text-slate-400 text-[9px]">WATER (m MSL)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-1.5 bg-sky-400/40 border border-sky-400" />
                  <span className="text-slate-400 text-[9px]">RADAR (mm/h)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-rose-500" />
                  <span className="text-rose-400 text-[9px]">BREACH (2.80m)</span>
                </div>
              </div>
            </div>

            {/* Render 3D Volumetric Hydrograph or 2D SVG Dual-Axis Chart */}
            {hydrographMode === "3d" ? (
              <Hydrograph3D
                scrubIndex={scrubIndex}
                onSelectScrubIndex={(idx) => setScrubIndex(idx)}
                isPlaying={isPlaying}
              />
            ) : (
              /* Dual-Axis SVG Chart */
              <div className="relative h-14 w-full bg-[#05080e] rounded-xs border border-[#1c2638] px-2 flex items-center">
                <div className="absolute inset-x-0 top-3 border-b border-rose-500/40 border-dashed pointer-events-none flex justify-end pr-2">
                  <span className="text-[8px] font-mono text-rose-400 bg-rose-950/60 px-1 rounded-xs">
                    CRITICAL BREACH +2.80m
                  </span>
                </div>

                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 60">
                  {/* Precipitation Bars */}
                  <rect x="40" y="45" width="14" height="15" fill="#38bdf8" fillOpacity="0.3" />
                  <rect x="80" y="40" width="14" height="20" fill="#38bdf8" fillOpacity="0.3" />
                  <rect x="120" y="32" width="14" height="28" fill="#38bdf8" fillOpacity="0.3" />
                  <rect x="160" y="25" width="14" height="35" fill="#38bdf8" fillOpacity="0.4" />
                  <rect x="200" y="15" width="14" height="45" fill="#38bdf8" fillOpacity="0.5" />
                  <rect x="240" y="10" width="14" height="50" fill="#38bdf8" fillOpacity="0.6" />
                  <rect x="280" y="12" width="14" height="48" fill="#38bdf8" fillOpacity="0.6" />
                  <rect x="320" y="20" width="14" height="40" fill="#38bdf8" fillOpacity="0.5" />
                  <rect x="360" y="30" width="14" height="30" fill="#38bdf8" fillOpacity="0.4" />
                  <rect x="400" y="35" width="14" height="25" fill="#38bdf8" fillOpacity="0.3" />

                  {/* T0 Marker */}
                  <line x1="500" y1="0" x2="500" y2="60" stroke="#38bdf8" strokeWidth="1.5" />

                  {/* Predictive Bars */}
                  <rect x="520" y="22" width="14" height="38" fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="0.5" />
                  <rect x="560" y="14" width="14" height="46" fill="#38bdf8" fillOpacity="0.45" stroke="#38bdf8" strokeWidth="0.5" />
                  <rect x="600" y="8" width="14" height="52" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="0.5" />
                  <rect x="640" y="15" width="14" height="45" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="0.5" />
                  <rect x="680" y="28" width="14" height="32" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="0.5" />
                  <rect x="720" y="38" width="14" height="22" fill="#38bdf8" fillOpacity="0.2" />
                  <rect x="760" y="44" width="14" height="16" fill="#38bdf8" fillOpacity="0.2" />

                  {/* Historical Line */}
                  <path d="M0,50 Q120,48 240,42 T400,28 T500,16" fill="none" stroke="#38bdf8" strokeWidth="2" />

                  {/* Confidence Ribbon */}
                  <path d="M500,16 Q600,6 700,10 T900,34 L900,46 Q700,24 600,20 T500,16 Z" fill="#38bdf8" fillOpacity="0.12" />

                  {/* Predictive Hydrograph Crossing Breach */}
                  <path d="M500,16 Q600,8 650,5 T750,22 T950,42" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6,3" />
                  <circle cx="650" cy="5" r="4" fill="#ef4444" className="animate-pulse" />
                </svg>

                <div className="absolute left-1/2 -top-2 transform -translate-x-1/2 bg-sky-500 text-black font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">
                  T_0 NOW (18:14 IST)
                </div>
              </div>
            )}

            {/* Time Controls */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2 py-0.5 rounded bg-[#121a2a] border border-[#1c2638] text-slate-200 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
                </button>
                <span className="text-slate-500">SLICE: 1-HOUR</span>
              </div>

              <div className="flex justify-between w-[60%] text-[9px] font-mono text-slate-400">
                {timeSlices.map((ts, idx) => (
                  <button
                    key={ts.label}
                    onClick={() => setScrubIndex(idx)}
                    className={`cursor-pointer ${
                      scrubIndex === idx
                        ? "text-sky-400 font-bold"
                        : ts.label.includes("APOGEE")
                        ? "text-rose-400 font-bold"
                        : "hover:text-slate-200"
                    }`}
                  >
                    {ts.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ------------------------------------------------------ */}
        {/* RIGHT COLUMN: PREDICTIVE PHYSICS & TRIAGE (3/12)       */}
        {/* ------------------------------------------------------ */}
        <aside className="xl:col-span-3 bg-[#0a0f1a] flex flex-col justify-between p-3 space-y-4">
          {/* Module A: S2S TIDAL SURGE & LOCK GAUGING */}
          <div className="p-3 rounded-sm bg-[#0c121e] border border-[#1c2638] space-y-2 corner-bracket">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                [SEC_02 // TIDAL_PHYSICS]
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[9px] font-mono">
                FREEBOARD: 0.25m
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              S2S Tidal Surge & Lock Gauging
            </h4>

            {/* Tidal Wave SVG */}
            <div className="p-2 bg-[#06090f] rounded-xs border border-[#1c2638]">
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-slate-400">HIGH TIDE: <span className="text-sky-400 font-bold">+2.95m MSL</span></span>
                <span className="text-slate-400">CREST: <span className="text-slate-200">3.20m MSL</span></span>
              </div>
              <svg className="w-full h-12" viewBox="0 0 300 70">
                <line x1="0" y1="12" x2="300" y2="12" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
                <text x="210" y="9" fill="#fca5a5" fontFamily="JetBrains Mono" fontSize="8">CREST 3.20m</text>
                <path d="M0,60 Q75,55 150,18 T300,55" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <circle cx="150" cy="18" r="4" fill="#38bdf8" className="animate-pulse" />
                <path d="M150,18 Q200,28 250,45 L250,12 L150,12 Z" fill="#ef4444" fillOpacity="0.2" />
              </svg>
            </div>

            {/* Sluice Interlock Status */}
            <div className="p-2 rounded-xs bg-[#1a0f12] border border-rose-500/40 text-[10px] font-mono flex items-start gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-rose-400 font-bold block uppercase">
                  INTERLOCK CRITICAL: SLUICE #4
                </span>
                <span className="text-slate-300">
                  {sluice4Locked
                    ? "Gates locked closed. Saltwater backflow prevented."
                    : "Closing in 28m 14s to prevent Hooghly saltwater tidal backflow."}
                </span>
              </div>
            </div>
          </div>

          {/* Module B: XAI TreeSHAP FLOOD ATTRIBUTION */}
          <div className="p-3 rounded-sm bg-[#0c121e] border border-[#1c2638] space-y-2.5 corner-bracket">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                [SEC_03 // CAUSAL_AI]
              </span>
              <span className="text-[9px] font-mono text-slate-400">TreeSHAP DECOMP</span>
            </div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Flood Attribution Breakdown
            </h4>

            <div className="space-y-2 text-[10px] font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Extreme Precipitation</span>
                  <span className="text-rose-400 font-bold">42.0%</span>
                </div>
                <div className="w-full bg-[#06090f] h-1.5 rounded-xs overflow-hidden">
                  <div className="bg-rose-500 h-full w-[42%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Hooghly Tidal Backflow</span>
                  <span className="text-sky-400 font-bold">28.0%</span>
                </div>
                <div className="w-full bg-[#06090f] h-1.5 rounded-xs overflow-hidden">
                  <div className="bg-sky-400 h-full w-[28%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Canal Silt Choke</span>
                  <span className="text-amber-400 font-bold">19.0%</span>
                </div>
                <div className="w-full bg-[#06090f] h-1.5 rounded-xs overflow-hidden">
                  <div className="bg-amber-400 h-full w-[19%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Impervious Soil Runoff</span>
                  <span className="text-slate-400 font-bold">11.0%</span>
                </div>
                <div className="w-full bg-[#06090f] h-1.5 rounded-xs overflow-hidden">
                  <div className="bg-slate-500 h-full w-[11%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Module C: SCENARIO SIMULATOR & DISPATCH */}
          <div className="p-3 rounded-sm bg-[#0c121e] border border-[#1c2638] space-y-3 corner-bracket flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                  [SEC_04 // DISPATCH_SIM]
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono">
                  HYDRO-ENGINE
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide mt-1">
                Tactical Dispatch Simulator
              </h4>

              {/* Sliders */}
              <div className="mt-3 space-y-2.5 text-[10px] font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">RAINFALL INTENSITY:</span>
                    <span className="text-sky-300 font-bold">+{rainfallRate} mm/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rainfallRate}
                    onChange={(e) => setRainfallRate(Number(e.target.value))}
                    className="w-full h-1 accent-sky-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">SILT DREDGE OFFSET:</span>
                    <span className="text-amber-400 font-bold">{siltDredge}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={siltDredge}
                    onChange={(e) => setSiltDredge(Number(e.target.value))}
                    className="w-full h-1 accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">EMERGENCY TURBINES:</span>
                    <span className="text-emerald-400 font-bold">{turbines} / 12 Units</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={turbines}
                    onChange={(e) => setTurbines(Number(e.target.value))}
                    className="w-full h-1 accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Computed Outcome Card */}
              <div className="mt-3 p-2.5 rounded-xs bg-[#060a12] border border-[#1c2638] text-[10px] font-mono">
                <span className="text-slate-500 block">SIMULATED RESIDUAL HEAD:</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base font-bold ${simulationOutcome.averted ? "text-emerald-400" : "text-rose-400"}`}>
                    {simulationOutcome.residualHead}m
                  </span>
                  <span className="text-slate-400">
                    RETENTION: <span className="text-slate-200">{simulationOutcome.retentionHours}h</span>
                  </span>
                </div>
                <div className={`mt-1 font-semibold ${simulationOutcome.averted ? "text-emerald-400" : "text-rose-400"}`}>
                  {simulationOutcome.averted
                    ? "✓ WARD 66 CREST OVERTOPPING AVERTED"
                    : "⚠ INUNDATION WARNING: CREST BREACH RISK"}
                </div>
              </div>
            </div>

            {/* Execute Dispatch CTA */}
            <div className="pt-2">
              <button
                onClick={handleExecuteDispatch}
                disabled={isDispatching}
                className="w-full py-2 px-3 rounded-xs bg-[#162a45] hover:bg-[#1d375a] border border-sky-500 text-sky-200 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDispatching ? (
                  <>
                    <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    EXECUTING DISPATCH PROTOCOL...
                  </>
                ) : dispatchExecuted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    DISPATCH TRANSMITTED TO KMC SUMPS
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    EXECUTE HYDRAULIC DISPATCH // CELL-DELTA
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
