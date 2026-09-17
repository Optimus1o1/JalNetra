"use client";

import React, { useState } from "react";
import { GridCell, SensorNode } from "@/lib/types";
import { PILOT_GRID_CELLS, PILOT_REGION_METADATA } from "@/lib/data/pilotRegionData";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";
import { getRiskColor } from "@/lib/utils";
import {
  Layers,
  Activity,
  Droplets,
  Building2,
  Maximize2,
  Compass,
  Radio,
  Eye,
  Radar,
  Info,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { CellDetailDrawer } from "./CellDetailDrawer";

type MapLayer = "risk" | "rainfall" | "elevation" | "imperviousness";

interface DigitalTwinMapProps {
  onSelectWard?: (wardNumber: number) => void;
  overrideCells?: GridCell[];
  className?: string;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  onSelectWard,
  overrideCells,
  className,
}) => {
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>("risk");
  const [showSensors, setShowSensors] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showRadarScan, setShowRadarScan] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<SensorNode | null>(null);

  const cells = overrideCells || PILOT_GRID_CELLS;

  // Geographic bounds conversion to SVG coordinate canvas (width 800, height 600)
  const minLat = 22.47;
  const maxLat = 22.63;
  const minLng = 88.28;
  const maxLng = 88.44;

  const projectPoint = (lat: number, lng: number): [number, number] => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 30;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 520 + 40; // Invert Y for SVG
    return [x, y];
  };

  const getCellFillColor = (cell: GridCell): string => {
    if (activeLayer === "risk") {
      if (cell.riskScore >= 0.75) return "rgba(239, 68, 68, 0.45)"; // Rose
      if (cell.riskScore >= 0.5) return "rgba(245, 158, 11, 0.4)"; // Amber
      if (cell.riskScore >= 0.25) return "rgba(6, 182, 212, 0.35)"; // Cyan
      return "rgba(16, 185, 129, 0.3)"; // Emerald
    }
    if (activeLayer === "rainfall") {
      // 50mm - 90mm scale
      const intensity = (cell.forecastRainfall24h - 50) / 40;
      return `rgba(59, 130, 246, ${0.25 + Math.min(0.6, intensity * 0.5)})`;
    }
    if (activeLayer === "elevation") {
      // 3.5m - 8.0m scale (lower is deeper blue/purple, higher is green/amber)
      if (cell.elevation <= 4.0) return "rgba(147, 51, 234, 0.4)";
      if (cell.elevation <= 5.5) return "rgba(6, 182, 212, 0.35)";
      return "rgba(34, 197, 94, 0.35)";
    }
    if (activeLayer === "imperviousness") {
      return `rgba(244, 63, 94, ${(cell.imperviousness / 100) * 0.5})`;
    }
    return "rgba(6, 182, 212, 0.3)";
  };

  const getCellStrokeColor = (cell: GridCell): string => {
    if (selectedCell?.id === cell.id) return "#22d3ee";
    if (cell.riskScore >= 0.75) return "rgba(239, 68, 68, 0.75)";
    if (cell.riskScore >= 0.5) return "rgba(245, 158, 11, 0.7)";
    if (cell.riskScore >= 0.25) return "rgba(6, 182, 212, 0.6)";
    return "rgba(16, 185, 129, 0.5)";
  };

  const handleCellClick = (cell: GridCell) => {
    setSelectedCell(cell);
    setSelectedSensor(null);
    if (onSelectWard) {
      onSelectWard(cell.wardNumber);
    }
  };

  return (
    <div className="relative w-full rounded border border-[#1c2638] bg-[#070b13] overflow-hidden shadow-md corner-bracket">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2.5 bg-[#090d16]/95 p-1.5 rounded-sm border border-[#1c2638]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[11px] font-semibold">
            <Radio className="w-3 h-3 animate-pulse text-sky-400" />
            <span className="uppercase tracking-wider">GIS TWIN // HOOGHLY ESTUARY</span>
          </div>

          {/* Layer Switcher */}
          <div className="flex items-center gap-0.5 bg-[#0e1422] p-0.5 rounded-xs border border-[#1c2638] text-[10px] font-mono">
            <button
              onClick={() => setActiveLayer("risk")}
              className={`px-2 py-0.5 rounded-xs uppercase tracking-wide transition-colors cursor-pointer ${
                activeLayer === "risk"
                  ? "bg-[#162235] text-sky-300 font-bold border border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              Risk Matrix
            </button>
            <button
              onClick={() => setActiveLayer("rainfall")}
              className={`px-2 py-0.5 rounded-xs uppercase tracking-wide transition-colors cursor-pointer ${
                activeLayer === "rainfall"
                  ? "bg-[#162235] text-sky-300 font-bold border border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              Rainfall (mm)
            </button>
            <button
              onClick={() => setActiveLayer("elevation")}
              className={`px-2 py-0.5 rounded-xs uppercase tracking-wide transition-colors cursor-pointer ${
                activeLayer === "elevation"
                  ? "bg-[#162235] text-sky-300 font-bold border border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              DEM Elevation
            </button>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => setShowSensors(!showSensors)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border uppercase tracking-wide transition-colors cursor-pointer ${
              showSensors
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 font-semibold"
                : "bg-[#0e1422] text-slate-500 border-[#1c2638]"
            }`}
          >
            <Activity className="w-2.5 h-2.5" />
            <span>Sensors ({IOT_SENSOR_NODES.length})</span>
          </button>

          <button
            onClick={() => setShowAssets(!showAssets)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border uppercase tracking-wide transition-colors cursor-pointer ${
              showAssets
                ? "bg-sky-950/40 text-sky-300 border-sky-500/40 font-semibold"
                : "bg-[#0e1422] text-slate-500 border-[#1c2638]"
            }`}
          >
            <Building2 className="w-2.5 h-2.5" />
            <span>Assets</span>
          </button>

          <button
            onClick={() => setShowRadarScan(!showRadarScan)}
            className={`p-1 rounded-xs border transition-colors cursor-pointer ${
              showRadarScan
                ? "bg-sky-950/40 text-sky-300 border-sky-500/40"
                : "bg-[#0e1422] text-slate-500 border-[#1c2638]"
            }`}
            title="Toggle Radar Sweep"
          >
            <Radar className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG GIS Canvas */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] min-h-[480px] select-none overflow-hidden flex items-center justify-center">
        {/* Radar beam scan overlay */}
        {showRadarScan && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <div className="w-[500px] h-[500px] rounded-full border border-cyan-500/20 flex items-center justify-center">
              <div className="w-[320px] h-[320px] rounded-full border border-cyan-500/25 flex items-center justify-center">
                <div className="w-[160px] h-[160px] rounded-full border border-cyan-500/30" />
              </div>
              <div className="absolute w-[500px] h-[500px] rounded-full radar-sweep-effect pointer-events-none bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent" />
            </div>
          </div>
        )}

        <svg
          viewBox="0 0 800 600"
          className="w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.8))" }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(6, 182, 212, 0.08)"
                strokeWidth="0.75"
              />
            </pattern>
            {/* River Gradient */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
            </linearGradient>
            {/* Canal Gradient */}
            <linearGradient id="canalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Background Map Matrix Grid */}
          <rect width="800" height="600" fill="#040914" />
          <rect width="800" height="600" fill="url(#gisGrid)" />

          {/* Hooghly River Main Corridor (Western Boundary) */}
          <path
            d="M 120,0 C 140,80 180,160 165,240 C 150,320 110,400 130,480 C 145,540 170,580 190,600 L 130,600 C 100,560 85,500 75,440 C 65,360 100,280 115,200 C 130,120 105,60 85,0 Z"
            fill="url(#riverGrad)"
            stroke="rgba(56, 189, 248, 0.5)"
            strokeWidth="1.5"
          />
          <text
            x="95"
            y="280"
            fill="rgba(186, 230, 253, 0.7)"
            fontSize="11"
            fontFamily="monospace"
            letterSpacing="3"
            transform="rotate(78, 95, 280)"
          >
            HOOGHLY RIVER (TIDAL ESTUARY)
          </text>

          {/* Major Drainage Canal Corridors */}
          {/* Bagjola Canal (North) */}
          <path
            d="M 165,110 Q 350,120 720,135"
            fill="none"
            stroke="url(#canalGrad)"
            strokeWidth="4"
            strokeDasharray="6,2"
          />
          <text x="360" y="105" fill="#38bdf8" fontSize="9" fontFamily="monospace">
            BAGJOLA CANAL (NORTH TRUNK) →
          </text>

          {/* Circular Canal (Central) */}
          <path
            d="M 165,230 Q 380,260 700,270"
            fill="none"
            stroke="url(#canalGrad)"
            strokeWidth="3.5"
          />
          <text x="350" y="248" fill="#38bdf8" fontSize="9" fontFamily="monospace">
            CIRCULAR CANAL →
          </text>

          {/* Tolly's Nullah / Adi Ganga (South) */}
          <path
            d="M 140,360 Q 280,410 650,440"
            fill="none"
            stroke="url(#canalGrad)"
            strokeWidth="3.5"
          />
          <text x="290" y="398" fill="#38bdf8" fontSize="9" fontFamily="monospace">
            TOLLY&apos;S NULLAH (ADI GANGA) →
          </text>

          {/* Monikhali Canal (South-West) */}
          <path
            d="M 130,470 Q 220,490 400,520"
            fill="none"
            stroke="url(#canalGrad)"
            strokeWidth="3"
          />
          <text x="220" y="482" fill="#38bdf8" fontSize="9" fontFamily="monospace">
            MONIKHALI CANAL →
          </text>

          {/* East Kolkata Wetlands Retention Zone (Eastern Boundary) */}
          <rect
            x="640"
            y="300"
            width="150"
            height="260"
            rx="12"
            fill="rgba(16, 185, 129, 0.12)"
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
          <text x="655" y="330" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
            EAST KOLKATA WETLANDS
          </text>
          <text x="655" y="348" fill="rgba(209, 250, 229, 0.6)" fontSize="8.5" fontFamily="monospace">
            RAMSAR CONSERVATION SITE
          </text>

          {/* Ward Grid Cells (Polygonal Zones) */}
          {cells.map((cell) => {
            const [cx, cy] = projectPoint(cell.coordinates[0], cell.coordinates[1]);
            const isSelected = selectedCell?.id === cell.id;

            // Approximate polygon boundaries around centroid
            const size = 36;
            const points = `
              ${cx - size * 1.1},${cy - size * 0.7}
              ${cx + size * 1.0},${cy - size * 0.9}
              ${cx + size * 1.3},${cy + size * 0.8}
              ${cx - size * 0.9},${cy + size * 1.0}
            `;

            return (
              <g
                key={cell.id}
                onClick={() => handleCellClick(cell)}
                className="cursor-pointer transition-all duration-300 group"
              >
                {/* Cell Polygon */}
                <polygon
                  points={points}
                  fill={getCellFillColor(cell)}
                  stroke={getCellStrokeColor(cell)}
                  strokeWidth={isSelected ? "3" : "1.5"}
                  strokeLinejoin="round"
                  className="transition-all duration-200 group-hover:stroke-cyan-300 group-hover:stroke-2"
                />

                {/* Ward Label */}
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  className="pointer-events-none"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                >
                  W-{cell.wardNumber}
                </text>

                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fill={cell.riskScore >= 0.75 ? "#fca5a5" : "#67e8f9"}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {activeLayer === "risk"
                    ? `R:${cell.riskScore.toFixed(2)}`
                    : activeLayer === "rainfall"
                    ? `${cell.forecastRainfall24h}mm`
                    : `${cell.elevation}m`}
                </text>
              </g>
            );
          })}

          {/* IoT Sensor Nodes Layer */}
          {showSensors &&
            IOT_SENSOR_NODES.map((sensor) => {
              const [sx, sy] = projectPoint(sensor.coordinates[0], sensor.coordinates[1]);
              const hasAnomaly = sensor.anomalyDetected;

              return (
                <g
                  key={sensor.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSensor(sensor);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse circle */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={hasAnomaly ? "11" : "8"}
                    fill={hasAnomaly ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}
                    stroke={hasAnomaly ? "#ef4444" : "#10b981"}
                    strokeWidth="1.5"
                  />
                  {/* Inner glowing pin */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r="4.5"
                    fill={hasAnomaly ? "#ef4444" : "#10b981"}
                    className={hasAnomaly ? "animate-ping" : ""}
                  />
                  {/* Sensor Station Code label */}
                  <rect
                    x={sx + 8}
                    y={sy - 9}
                    width="68"
                    height="16"
                    rx="4"
                    fill="rgba(3, 7, 18, 0.85)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.8"
                  />
                  <text
                    x={sx + 12}
                    y={sy + 3}
                    fill="#e2e8f0"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {sensor.waterLevelM.toFixed(1)}m WL
                  </text>
                </g>
              );
            })}

          {/* Critical Assets Layer */}
          {showAssets && (
            <g pointerEvents="none">
              {/* SSKM Hospital */}
              <g transform="translate(320, 290)">
                <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#ef4444" opacity="0.9" />
                <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  +
                </text>
                <text x="14" y="3" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  SSKM
                </text>
              </g>

              {/* Ruby Hospital */}
              <g transform="translate(560, 360)">
                <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#ef4444" opacity="0.9" />
                <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  +
                </text>
                <text x="14" y="3" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  RUBY
                </text>
              </g>

              {/* Palmer Bazar Pumping Station */}
              <g transform="translate(500, 240)">
                <circle cx="0" cy="0" r="9" fill="#06b6d4" opacity="0.9" />
                <text x="0" y="3" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">
                  P
                </text>
                <text x="12" y="3" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  PALMER PS
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Selected Sensor Floating Tooltip */}
        {selectedSensor && (
          <div className="absolute bottom-4 left-4 z-30 max-w-sm p-4 rounded-xl bg-[rgba(3,7,18,0.95)] border border-cyan-500/40 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {selectedSensor.stationCode}
              </span>
              <Badge
                variant={selectedSensor.anomalyDetected ? "rose" : "emerald"}
                size="sm"
              >
                {selectedSensor.status.toUpperCase()}
              </Badge>
            </div>
            <h5 className="text-sm font-semibold text-slate-100">{selectedSensor.name}</h5>
            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Water Level</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {selectedSensor.waterLevelM} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Danger: {selectedSensor.dangerLevelM}m
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Discharge</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {selectedSensor.dischargeCusecs} cusecs
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Flow: {selectedSensor.flowVelocityMs} m/s
                </span>
              </div>
            </div>
            {selectedSensor.anomalyMessage && (
              <p className="mt-2 text-xs text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-800/60 font-mono">
                ⚠ {selectedSensor.anomalyMessage}
              </p>
            )}
            <button
              onClick={() => setSelectedSensor(null)}
              className="mt-2 text-[11px] text-slate-400 hover:text-white underline block"
            >
              Dismiss Sensor Tooltip
            </button>
          </div>
        )}
      </div>

      {/* Bottom Map Legend */}
      <div className="p-3 bg-[rgba(3,7,18,0.92)] border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="text-slate-300 font-semibold">LEGEND:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/60 border border-rose-500" />
            <span>Critical (&gt;0.75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/60 border border-amber-500" />
            <span>Elevated (0.50-0.74)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500/60 border border-cyan-500" />
            <span>Moderate (0.25-0.49)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/60 border border-emerald-500" />
            <span>Low (&lt;0.25)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>Click any Ward polygon to inspect TreeSHAP factors</span>
          <span className="text-cyan-400">● 12 Pilot Cells</span>
        </div>
      </div>

      {/* Slide-out Drawer for selected cell */}
      <CellDetailDrawer cell={selectedCell} onClose={() => setSelectedCell(null)} />
    </div>
  );
};
