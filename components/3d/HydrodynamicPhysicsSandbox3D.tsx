"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { PlaySquare, Compass, Shield, Zap, Droplets, RotateCw } from "lucide-react";

interface HydrodynamicSandboxProps {
  rainfallMultiplier: number;
  emergencyPumpsActive: boolean;
  temporaryBundsDeployed: boolean;
  drainageEfficiencyPct: number;
  tidalSurgeMeters: number;
}

export const HydrodynamicPhysicsSandbox3D: React.FC<HydrodynamicSandboxProps> = ({
  rainfallMultiplier,
  emergencyPumpsActive,
  temporaryBundsDeployed,
  drainageEfficiencyPct,
  tidalSurgeMeters,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const rainPointsRef = useRef<THREE.Points | null>(null);
  const bundMeshesRef = useRef<THREE.Mesh[]>([]);
  const pumpVortexRef = useRef<THREE.Group[]>([]);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);

  // Keep live props in ref for animation loop
  const propsRef = useRef({
    rainfallMultiplier,
    emergencyPumpsActive,
    temporaryBundsDeployed,
    drainageEfficiencyPct,
    tidalSurgeMeters,
  });

  useEffect(() => {
    propsRef.current = {
      rainfallMultiplier,
      emergencyPumpsActive,
      temporaryBundsDeployed,
      drainageEfficiencyPct,
      tidalSurgeMeters,
    };

    // Update bunds visibility dynamically
    bundMeshesRef.current.forEach((b) => {
      b.visible = temporaryBundsDeployed;
    });

    // Update pump vortexes visibility dynamically
    pumpVortexRef.current.forEach((v) => {
      v.visible = emergencyPumpsActive;
    });

    // Update water level
    if (waterMeshRef.current) {
      const targetWaterY = Math.max(
        0.5,
        1.5 + rainfallMultiplier * 1.8 + tidalSurgeMeters * 1.2 - (emergencyPumpsActive ? 1.4 : 0)
      );
      waterMeshRef.current.position.y = targetWaterY;
    }
  }, [rainfallMultiplier, emergencyPumpsActive, temporaryBundsDeployed, drainageEfficiencyPct, tidalSurgeMeters]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(65, 55, 75);
    camera.lookAt(0, 5, 0);
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

    // 3a. Base City Grid & Ground
    const groundGeo = new THREE.BoxGeometry(80, 2, 80);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a101d, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    mainGroup.add(ground);

    const gridHelper = new THREE.GridHelper(80, 20, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = 0.05;
    mainGroup.add(gridHelper);

    // 3b. 3D City Buildings (Low-poly urban wards)
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.3,
    });
    const hospitalMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });

    const buildingPositions = [
      { x: -22, z: -22, w: 10, h: 18, d: 8 },
      { x: -8, z: -25, w: 8, h: 12, d: 8 },
      { x: -24, z: -8, w: 12, h: 15, d: 10 },
      { x: 18, z: -18, w: 14, h: 22, d: 10, isAsset: true }, // Medical College Asset
      { x: 25, z: 12, w: 10, h: 16, d: 12 },
      { x: -18, z: 20, w: 12, h: 14, d: 10 },
      { x: 5, z: 22, w: 10, h: 20, d: 8 },
      { x: -5, z: 12, w: 8, h: 10, d: 8 },
    ];

    buildingPositions.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(geo, b.isAsset ? hospitalMat : buildingMat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mainGroup.add(mesh);

      // Edge outline
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: b.isAsset ? 0x38bdf8 : 0x475569 })
      );
      mesh.add(line);
    });

    // 3c. Drainage Canal Siphon Trench
    const canalGeo = new THREE.BoxGeometry(70, 1.2, 8);
    const canalMat = new THREE.MeshStandardMaterial({ color: 0x030712 });
    const canalMesh = new THREE.Mesh(canalGeo, canalMat);
    canalMesh.position.set(0, 0.4, 0);
    mainGroup.add(canalMesh);

    // 3d. Dynamic Water Accumulation Mesh
    const waterGeo = new THREE.PlaneGeometry(76, 76, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.3,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 2.2;
    mainGroup.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 3e. Temporary Bunds (Perimeter barrier walls)
    bundMeshesRef.current = [];
    const bundPositions = [
      { x: 18, z: -10, w: 18, h: 4.5, d: 1.5 },
      { x: 8, z: -18, w: 1.5, h: 4.5, d: 18 },
      { x: -12, z: 4.5, w: 32, h: 3.5, d: 1.5 },
    ];

    bundPositions.forEach((bp) => {
      const bundGeo = new THREE.BoxGeometry(bp.w, bp.h, bp.d);
      const bundMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.4,
      });
      const bundMesh = new THREE.Mesh(bundGeo, bundMat);
      bundMesh.position.set(bp.x, bp.h / 2, bp.z);
      bundMesh.visible = propsRef.current.temporaryBundsDeployed;
      mainGroup.add(bundMesh);
      bundMeshesRef.current.push(bundMesh);
    });

    // 3f. Emergency Dewatering Pump Vortexes
    pumpVortexRef.current = [];
    const pumpLocations = [
      { x: -20, z: 2 },
      { x: 15, z: -2 },
    ];

    pumpLocations.forEach((loc) => {
      const vGroup = new THREE.Group();
      vGroup.position.set(loc.x, 2, loc.z);

      const coneGeo = new THREE.ConeGeometry(3.5, 5, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.rotation.x = Math.PI;
      vGroup.add(coneMesh);

      vGroup.visible = propsRef.current.emergencyPumpsActive;
      mainGroup.add(vGroup);
      pumpVortexRef.current.push(vGroup);
    });

    // 3g. Falling Rain Particle Streaks
    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 80;
      rainPos[i * 3 + 1] = Math.random() * 50;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 1.4,
      transparent: true,
      opacity: 0.75,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    mainGroup.add(rainPoints);
    rainPointsRef.current = rainPoints;

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(40, 50, 40);
    scene.add(dir);

    // 4. Pointer Controls
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

      // Animate rain falling down
      if (rainPointsRef.current) {
        const pArr = rainPointsRef.current.geometry.attributes.position.array as Float32Array;
        const fallSpeed = 0.8 * propsRef.current.rainfallMultiplier;
        for (let i = 0; i < rainCount; i++) {
          pArr[i * 3 + 1] -= fallSpeed;
          if (pArr[i * 3 + 1] < 0) {
            pArr[i * 3 + 1] = 45;
          }
        }
        rainPointsRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Rotate active pump vortexes
      if (propsRef.current.emergencyPumpsActive) {
        pumpVortexRef.current.forEach((v) => {
          v.rotation.y += 0.15;
        });
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
      groundGeo.dispose();
      groundMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      rainGeo.dispose();
      rainMat.dispose();
    };
  }, []);

  const resetView = () => {
    if (!groupRef.current || !cameraRef.current) return;
    groupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(65, 55, 75);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <PlaySquare className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            3D Hydrodynamic Physics Sandbox // Real-Time Inundation Response
          </span>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Live Physical Action State Badges */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400">Deployed Interventions:</span>
          {emergencyPumpsActive ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 text-emerald-400" />
              Turbine Vortexes Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Pumps Standby
            </span>
          )}

          {temporaryBundsDeployed ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
              <Shield className="w-3 h-3 text-amber-400" />
              Defensive Bund Walls Up
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              No Bund Barriers
            </span>
          )}
        </div>

        <div className="text-slate-400">
          Precipitation Vector: <span className="text-cyan-400 font-bold">{rainfallMultiplier}x Base Flux</span>
        </div>
      </div>
    </div>
  );
};
