"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Waves, ShieldAlert, ArrowDownUp, CheckCircle, RotateCw, Compass } from "lucide-react";

export const HydraulicSluiceGate3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gateState, setGateState] = useState<"locked" | "open">("locked");
  const [riverLevelM, setRiverLevelM] = useState<number>(5.42);
  const [canalLevelM, setCanalLevelM] = useState<number>(3.15);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gateMeshRef = useRef<THREE.Mesh | null>(null);
  const pistonRef = useRef<THREE.Mesh | null>(null);
  const riverWaterRef = useRef<THREE.Mesh | null>(null);
  const canalWaterRef = useRef<THREE.Mesh | null>(null);
  const particleGroupRef = useRef<THREE.Points | null>(null);
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
    camera.position.set(75, 60, 95);
    camera.lookAt(0, 10, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Main Group
    const mainGroup = new THREE.Group();
    groupRef.current = mainGroup;
    scene.add(mainGroup);

    // 3a. Concrete Embankments & Flume Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Left wall
    const leftWallGeo = new THREE.BoxGeometry(100, 30, 8);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(0, 15, -24);
    mainGroup.add(leftWall);

    // Right wall
    const rightWallGeo = new THREE.BoxGeometry(100, 30, 8);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(0, 15, 24);
    mainGroup.add(rightWall);

    // Bed base
    const bedGeo = new THREE.BoxGeometry(100, 4, 40);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(0, 0, 0);
    mainGroup.add(bed);

    // 3b. Sluice Gate Gantry Towers & Hydraulic Piston
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const towerGeo = new THREE.BoxGeometry(6, 45, 6);

    const tower1 = new THREE.Mesh(towerGeo, towerMat);
    tower1.position.set(0, 24, -20);
    mainGroup.add(tower1);

    const tower2 = new THREE.Mesh(towerGeo, towerMat);
    tower2.position.set(0, 24, 20);
    mainGroup.add(tower2);

    // Overhead crossbar
    const crossbarGeo = new THREE.BoxGeometry(8, 4, 44);
    const crossbar = new THREE.Mesh(crossbarGeo, towerMat);
    crossbar.position.set(0, 44, 0);
    mainGroup.add(crossbar);

    // Hydraulic piston rod
    const pistonGeo = new THREE.CylinderGeometry(1.2, 1.2, 22, 16);
    const pistonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const piston = new THREE.Mesh(pistonGeo, pistonMat);
    piston.position.set(0, 32, 0);
    mainGroup.add(piston);
    pistonRef.current = piston;

    // Sluice Gate Heavy Steel Plate
    const gateGeo = new THREE.BoxGeometry(4, 24, 38);
    const gateMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.7,
      roughness: 0.3,
    });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, gateState === "locked" ? 14 : 28, 0);
    mainGroup.add(gateMesh);
    gateMeshRef.current = gateMesh;

    // 3c. Water Channels: River Side (Left/Negative X) & Canal Side (Right/Positive X)
    // Hooghly River Water Surface (Tidal Surge)
    const riverGeo = new THREE.PlaneGeometry(48, 38, 24, 24);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.2,
    });
    const riverWater = new THREE.Mesh(riverGeo, riverMat);
    riverWater.rotation.x = -Math.PI / 2;
    riverWater.position.set(-25, gateState === "locked" ? 20 : 10, 0);
    mainGroup.add(riverWater);
    riverWaterRef.current = riverWater;

    // Inland Drainage Canal Water Surface
    const canalGeo = new THREE.PlaneGeometry(48, 38, 24, 24);
    const canalMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.2,
    });
    const canalWater = new THREE.Mesh(canalGeo, canalMat);
    canalWater.rotation.x = -Math.PI / 2;
    canalWater.position.set(25, 12, 0);
    mainGroup.add(canalWater);
    canalWaterRef.current = canalWater;

    // 3d. Flow Streamline Particles
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pVelocities = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 80;
      pPositions[i * 3 + 1] = 6 + Math.random() * 8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 34;
      pVelocities[i] = 0.5 + Math.random() * 1.5;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 1.6,
      transparent: true,
      opacity: 0.7,
    });
    const pPoints = new THREE.Points(pGeo, pMat);
    mainGroup.add(pPoints);
    particleGroupRef.current = pPoints;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(50, 60, 40);
    scene.add(dirLight);

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

      // Dynamic water vertex ripple
      if (riverWaterRef.current && canalWaterRef.current) {
        riverWaterRef.current.position.y = (gateState === "locked" ? 20 : 10) + Math.sin(time) * 0.4;
        canalWaterRef.current.position.y = 12 + Math.cos(time * 0.8) * 0.25;
      }

      // Smooth Gate Position Transition
      if (gateMeshRef.current && pistonRef.current) {
        const targetGateY = gateState === "locked" ? 14 : 27;
        gateMeshRef.current.position.y += (targetGateY - gateMeshRef.current.position.y) * 0.08;

        const targetPistonY = gateState === "locked" ? 31 : 40;
        pistonRef.current.position.y += (targetPistonY - pistonRef.current.position.y) * 0.08;
      }

      // Water flow particles
      if (particleGroupRef.current) {
        const pos = particleGroupRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          if (gateState === "open") {
            // High velocity outfall towards River (negative X direction)
            pos[i * 3] -= pVelocities[i] * 0.9;
            if (pos[i * 3] < -45) pos[i * 3] = 45;
          } else {
            // Blocked surging ripple oscillation
            pos[i * 3] += Math.sin(time + i) * 0.15;
          }
        }
        particleGroupRef.current.geometry.attributes.position.needsUpdate = true;
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
      wallMat.dispose();
      gateGeo.dispose();
      gateMat.dispose();
      riverGeo.dispose();
      riverMat.dispose();
    };
  }, [gateState]);

  const toggleGate = (mode: "locked" | "open") => {
    setGateState(mode);
    if (mode === "locked") {
      setRiverLevelM(5.42);
      setCanalLevelM(3.15);
    } else {
      setRiverLevelM(1.85);
      setCanalLevelM(2.95);
    }
  };

  const resetView = () => {
    if (!groupRef.current || !cameraRef.current) return;
    groupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(75, 60, 95);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            3D Hydraulic Sluice Gate 04 // Garden Reach Confluence
          </span>
        </div>

        {/* State Toggle & View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleGate(gateState === "locked" ? "open" : "locked")}
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              gateState === "locked"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
            }`}
          >
            {gateState === "locked" ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Interlock Engaged (Backflow Blocked)
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Gate Raised (Gravity Outfall Active)
              </>
            )}
          </button>

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

      {/* Hydraulic Stage Telemetry Grid */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px]">HOOGHLY RIVER STAGE</div>
          <div className="text-cyan-300 font-bold text-base mt-0.5">{riverLevelM.toFixed(2)} m MSL</div>
          <div className="text-[10px] text-slate-500">{gateState === "locked" ? "Spring High Tide Surge" : "Low Ebb Outfall"}</div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px]">CANAL DISCHARGE HEAD</div>
          <div className="text-cyan-300 font-bold text-base mt-0.5">{canalLevelM.toFixed(2)} m MSL</div>
          <div className="text-[10px] text-slate-500">Chetla / Topsia Canal Sump</div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px]">HEAD DIFFERENTIAL (ΔH)</div>
          <div
            className={`font-bold text-base mt-0.5 ${
              riverLevelM > canalLevelM ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {riverLevelM > canalLevelM ? "+" : ""}
            {(riverLevelM - canalLevelM).toFixed(2)} m
          </div>
          <div className="text-[10px] text-slate-500">
            {riverLevelM > canalLevelM ? "Reverse Gradient" : "Gravity Gradient"}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px]">HYDRAULIC STATUS</div>
          <div
            className={`font-bold text-sm mt-1 uppercase ${
              gateState === "locked" ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {gateState === "locked" ? "LOCKED // PREVENT_BACKFLOW" : "DISCHARGE // 24.5 M³/S"}
          </div>
          <div className="text-[10px] text-slate-500">Actuator: SCADA-Dual-Piston</div>
        </div>
      </div>
    </div>
  );
};
