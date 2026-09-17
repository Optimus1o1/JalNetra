"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { GridCell } from "@/lib/types";
import { Mountain, Layers, Eye, Compass, RotateCw } from "lucide-react";

interface TopographicBasin3DProps {
  onSelectWard?: (wardNumber: number) => void;
}

export const TopographicBasin3D: React.FC<TopographicBasin3DProps> = ({ onSelectWard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floodPlaneM, setFloodPlaneM] = useState<number>(2.5); // Meters MSL
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(PILOT_GRID_CELLS[0]);
  const [submergedWardsCount, setSubmergedWardsCount] = useState<number>(3);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const waterPlaneRef = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 95, 135);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Main Terrain Group
    const terrainGroup = new THREE.Group();
    groupRef.current = terrainGroup;
    scene.add(terrainGroup);

    // 3a. 3D Digital Elevation Model (DEM) Grid Mesh
    const terrainSize = 100;
    const segments = 40;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    // Morph vertices to match Kolkata basin topography (lower in east wetlands, higher in center-south)
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Natural bowl depression towards the east (+X) and low gradient
      const eastDepression = (vx / 50) * -3.5;
      const tidalGradient = (vz / 50) * 2.0;
      const localNoise = Math.sin(vx * 0.1) * Math.cos(vz * 0.1) * 2.0;

      const vy = Math.max(0.5, 4.5 + eastDepression + tidalGradient + localNoise);
      pos.setY(i, vy);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.15,
      wireframe: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainGroup.add(terrainMesh);

    // Grid wireframe overlay on terrain
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const terrainWire = new THREE.Mesh(terrainGeo, wireframeMat);
    terrainWire.position.y += 0.05;
    terrainGroup.add(terrainWire);

    // 3b. Interactive 3D Flood Plane Water Surface
    const waterGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.3,
    });
    const waterPlane = new THREE.Mesh(waterGeo, waterMat);
    waterPlane.position.y = floodPlaneM * 2.2; // Scale factor for visual clarity
    terrainGroup.add(waterPlane);
    waterPlaneRef.current = waterPlane;

    // 3c. 3D Ward Pillars and Beacons
    const beaconMeshes: { mesh: THREE.Mesh; cell: GridCell }[] = [];

    // Map geographic coordinates into local 3D terrain space
    // Center: [22.53, 88.36]
    const centerLat = 22.53;
    const centerLon = 88.36;
    const latScale = 1400;
    const lonScale = 1400;

    PILOT_GRID_CELLS.forEach((cell) => {
      const x = (cell.coordinates[1] - centerLon) * lonScale;
      const z = -(cell.coordinates[0] - centerLat) * latScale;
      const y = cell.elevation * 1.8;

      const pillarHeight = Math.max(3, y);
      const pillarGeo = new THREE.CylinderGeometry(1.2, 1.6, pillarHeight, 16);

      // Color by risk: red for high, amber for warn, cyan for nominal
      const pillarColor =
        cell.riskScore >= 0.75 ? 0xef4444 : cell.riskScore >= 0.5 ? 0xf59e0b : 0x06b6d4;

      const pillarMat = new THREE.MeshStandardMaterial({
        color: pillarColor,
        emissive: pillarColor,
        emissiveIntensity: 0.3,
        metalness: 0.4,
      });

      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, pillarHeight / 2, z);
      terrainGroup.add(pillar);

      // Floating beacon sphere on top
      const beaconGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: pillarColor });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(x, pillarHeight + 1.6, z);
      terrainGroup.add(beacon);

      beaconMeshes.push({ mesh: beacon, cell });
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(40, 60, 50);
    scene.add(sunLight);

    // 4. Pointer Drag Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevX = cx;
      prevY = cy;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !groupRef.current) return;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;

      const dx = cx - prevX;
      const dy = cy - prevY;

      groupRef.current.rotation.y += dx * 0.007;
      groupRef.current.rotation.x = Math.max(-0.2, Math.min(0.6, groupRef.current.rotation.x + dy * 0.005));

      prevX = cx;
      prevY = cy;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    domElement.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    // 5. Animation Loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.03;

      if (waterPlaneRef.current) {
        waterPlaneRef.current.position.y = floodPlaneM * 2.2 + Math.sin(time) * 0.12;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      domElement.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      resizeObserver.disconnect();
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
    };
  }, []);

  const handleWaterLevelChange = (m: number) => {
    setFloodPlaneM(m);
    if (waterPlaneRef.current) {
      waterPlaneRef.current.position.y = m * 2.2;
    }
    // Count submerged wards (elevation <= simulated water plane)
    const submerged = PILOT_GRID_CELLS.filter((c) => c.elevation <= m).length;
    setSubmergedWardsCount(submerged);
  };

  const resetView = () => {
    if (!groupRef.current || !cameraRef.current) return;
    groupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 95, 135);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            3D Digital Elevation Model (DEM) // Basin Depression Simulator
          </span>
        </div>

        {/* Inundation Water Plane Slider */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded">
            <span>Simulated Flood Stage:</span>
            <span className="text-cyan-400 font-bold">{floodPlaneM.toFixed(1)}m MSL</span>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.2"
              value={floodPlaneM}
              onChange={(e) => handleWaterLevelChange(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={resetView}
            title="Reset Angle"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[360px] sm:h-[420px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Interactive Ward Selector Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PILOT_GRID_CELLS.slice(0, 6).map((cell) => (
            <button
              key={cell.id}
              onClick={() => {
                setSelectedCell(cell);
                onSelectWard?.(cell.wardNumber);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                selectedCell?.id === cell.id
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold"
                  : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              W-{cell.wardNumber} ({cell.elevation}m)
            </button>
          ))}
        </div>

        <div className="text-xs font-mono">
          <span className="text-slate-400">Submerged at current head: </span>
          <span className={`font-bold ${submergedWardsCount > 2 ? "text-rose-400" : "text-emerald-400"}`}>
            {submergedWardsCount} / 12 Wards
          </span>
        </div>
      </div>

      {/* Selected Ward Telemetry Readout */}
      {selectedCell && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 font-sans">{selectedCell.wardName}</span>
            <span className="text-slate-500">(Borough {selectedCell.borough})</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div>
              Elevation: <span className="text-cyan-400 font-bold">{selectedCell.elevation}m MSL</span>
            </div>
            <div>
              Imperviousness: <span className="text-amber-400 font-bold">{selectedCell.imperviousness}%</span>
            </div>
            <div>
              Composite Risk:{" "}
              <span className={`font-bold ${selectedCell.riskScore >= 0.75 ? "text-rose-400" : "text-emerald-400"}`}>
                {selectedCell.riskScore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
