"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Radio, RotateCw, Layers, ZoomIn, ZoomOut, Compass, Wind } from "lucide-react";

export const VolumetricRadar3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elevationAngle, setElevationAngle] = useState<number>(4.5); // degrees
  const [sweepActive, setSweepActive] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<"all" | "core" | "stratiform">("all");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const radarBeamRef = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setSweepActive(false);
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 110, 170);
    camera.lookAt(0, 15, 0);
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

    // 3a. Base Ground Grid & Range Rings
    const gridHelper = new THREE.GridHelper(160, 16, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = 0;
    mainGroup.add(gridHelper);

    // Range Rings (15km, 30km, 50km equivalent scale)
    const ringRadii = [30, 55, 75];
    const ringLabels = ["15 km", "30 km", "50 km"];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.25, r + 0.25, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 2 ? 0x06b6d4 : 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      mainGroup.add(ringMesh);
    });

    // 3b. Alipore Doppler Radar Station Model
    const towerGeo = new THREE.CylinderGeometry(1.5, 3.5, 12, 16);
    const towerMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = 6;
    mainGroup.add(towerMesh);

    const radomeGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const radomeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const radomeMesh = new THREE.Mesh(radomeGeo, radomeMat);
    radomeMesh.position.y = 13;
    mainGroup.add(radomeMesh);

    // 3c. Rotating Volumetric Radar Cone Beam
    const beamGeo = new THREE.ConeGeometry(50, 80, 32, 1, true, 0, Math.PI / 6);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      wireframe: false,
    });
    const radarBeam = new THREE.Mesh(beamGeo, beamMat);
    radarBeam.position.y = 13;
    radarBeam.rotation.x = Math.PI / 2 + (elevationAngle * Math.PI) / 180;
    mainGroup.add(radarBeam);
    radarBeamRef.current = radarBeam;

    // 3d. 3D Volumetric Storm Cell Particle Cloud (Reflectivity point cloud)
    const particleCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Generate convective storm cell cluster over the Eastern Basin (Bagjola / Topsia sector)
    const stormCenterX = 25;
    const stormCenterZ = -20;

    for (let i = 0; i < particleCount; i++) {
      // Gaussian distribution for storm cell
      const u = Math.random();
      const v = Math.random();
      const radius = Math.sqrt(-2.0 * Math.log(u)) * 18;
      const angle = 2.0 * Math.PI * v;

      const px = stormCenterX + radius * Math.cos(angle);
      const pz = stormCenterZ + radius * Math.sin(angle);
      // Height profile (up to 45 units ~ 12km)
      const py = Math.max(1, (1.0 - radius / 35) * (15 + Math.random() * 32));

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      // Color based on dBZ intensity
      const distFromCenter = Math.sqrt((px - stormCenterX) ** 2 + (pz - stormCenterZ) ** 2);
      if (distFromCenter < 8 && py > 10) {
        // High core (>50 dBZ) - Magenta / Crimson
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.15;
        colors[i * 3 + 2] = 0.45;
      } else if (distFromCenter < 18) {
        // Heavy rain (38-48 dBZ) - Amber / Yellow
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.65;
        colors[i * 3 + 2] = 0.05;
      } else {
        // Stratiform rain (20-35 dBZ) - Cyan / Green
        colors[i * 3] = 0.05;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 0.85;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const pointCloud = new THREE.Points(geometry, pMaterial);
    mainGroup.add(pointCloud);
    pointsRef.current = pointCloud;

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
      groupRef.current.rotation.x = Math.max(-0.2, Math.min(0.8, groupRef.current.rotation.x + dy * 0.005));

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
    let beamAngle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (sweepActive && radarBeamRef.current) {
        beamAngle += 0.035;
        radarBeamRef.current.rotation.y = beamAngle;
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
      geometry.dispose();
      pMaterial.dispose();
      beamGeo.dispose();
      beamMat.dispose();
    };
  }, [sweepActive, elevationAngle]);

  const handleElevationChange = (deg: number) => {
    setElevationAngle(deg);
    if (radarBeamRef.current) {
      radarBeamRef.current.rotation.x = Math.PI / 2 + (deg * Math.PI) / 180;
    }
  };

  const resetView = () => {
    if (!groupRef.current || !cameraRef.current) return;
    groupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 110, 170);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            Alipore S-Band 3D Volumetric Doppler Radar // 2.8 GHz
          </span>
        </div>

        {/* Viewport Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Elevation Angle Slider */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-1 rounded">
            <span>Beam Tilt:</span>
            <span className="text-cyan-400 font-bold">{elevationAngle}°</span>
            <input
              type="range"
              min="0.5"
              max="19.5"
              step="0.5"
              value={elevationAngle}
              onChange={(e) => handleElevationChange(parseFloat(e.target.value))}
              className="w-16 accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={() => setSweepActive(!sweepActive)}
            className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
              sweepActive
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${sweepActive ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{sweepActive ? "Sweeping" : "Hold"}</span>
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

      {/* dBZ Reflectivity Scale Legend */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-200">Reflectivity (dBZ):</span>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              20-35 dBZ (Light)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              35-48 dBZ (Heavy)
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              &gt;50 dBZ (Severe Cell)
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Range Rings: <span className="text-cyan-400">15km / 30km / 50km</span> | Alipore Origin
        </div>
      </div>
    </div>
  );
};
