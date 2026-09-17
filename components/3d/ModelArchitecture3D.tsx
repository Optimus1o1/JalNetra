"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Cpu, Activity, RotateCw, Compass, GitBranch, Layers } from "lucide-react";

export const ModelArchitecture3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"network" | "lossLandscape">("network");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
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
    camera.position.set(0, 45, 90);
    camera.lookAt(0, 0, 0);
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

    // Objects to animate
    const pulsingPackets: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; progress: number }[] = [];

    if (viewMode === "network") {
      // 3A. NEURAL NETWORK ARCHITECTURE VIEW
      // Layer 1: Inputs (X = -32)
      // Layer 2: Spatial CNN / GCN (X = -12)
      // Layer 3: Temporal Causal Conv TCN (X = 8)
      // Layer 4: Physics-Informed Residual PINN (Y = 18, X = -2)
      // Layer 5: Output Heads (X = 28)

      const layerConfig = [
        { x: -32, count: 5, color: 0x0284c7, label: "Input Telemetry (Radar/GPM/DEM)" },
        { x: -12, count: 6, color: 0x06b6d4, label: "Spatiotemporal Encoder" },
        { x: 8, count: 5, color: 0xa855f7, label: "Dilated Temporal Causal TCN" },
        { x: 28, count: 3, color: 0x10b981, label: "P10/P50/P90 Quantile Envelopes" },
      ];

      const layerNodes: THREE.Vector3[][] = [];

      layerConfig.forEach((l) => {
        const nodesInLayer: THREE.Vector3[] = [];
        const spacing = 7;
        const startY = -((l.count - 1) * spacing) / 2;

        for (let i = 0; i < l.count; i++) {
          const pos = new THREE.Vector3(l.x, startY + i * spacing, (Math.random() - 0.5) * 4);
          nodesInLayer.push(pos);

          // Node sphere
          const nodeGeo = new THREE.SphereGeometry(1.6, 16, 16);
          const nodeMat = new THREE.MeshStandardMaterial({
            color: l.color,
            emissive: l.color,
            emissiveIntensity: 0.4,
            roughness: 0.2,
          });
          const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
          nodeMesh.position.copy(pos);
          mainGroup.add(nodeMesh);
        }
        layerNodes.push(nodesInLayer);
      });

      // Physics Constraint Cluster (PINN Loss Nodes at Top)
      const pinnNodes = [
        new THREE.Vector3(-14, 18, 5),
        new THREE.Vector3(0, 20, 0),
        new THREE.Vector3(14, 18, -5),
      ];

      pinnNodes.forEach((pos) => {
        const pGeo = new THREE.OctahedronGeometry(2.2);
        const pMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.5,
          wireframe: true,
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        mainGroup.add(pMesh);
      });

      // Connect layers with synaptic line segments
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
      });

      for (let l = 0; l < layerNodes.length - 1; l++) {
        const fromNodes = layerNodes[l];
        const toNodes = layerNodes[l + 1];

        fromNodes.forEach((fn) => {
          toNodes.forEach((tn) => {
            const lineGeo = new THREE.BufferGeometry().setFromPoints([fn, tn]);
            const line = new THREE.Line(lineGeo, lineMat);
            mainGroup.add(line);

            // Add occasional pulsing signal packet
            if (Math.random() > 0.6) {
              const packetGeo = new THREE.SphereGeometry(0.5, 8, 8);
              const packetMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
              const packetMesh = new THREE.Mesh(packetGeo, packetMat);
              packetMesh.position.copy(fn);
              mainGroup.add(packetMesh);
              pulsingPackets.push({
                mesh: packetMesh,
                start: fn,
                end: tn,
                progress: Math.random(),
              });
            }
          });
        });
      }

      // Connect PINN nodes to hidden layers
      pinnNodes.forEach((pn) => {
        layerNodes[1].forEach((hn) => {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([pn, hn]);
          const line = new THREE.Line(
            lineGeo,
            new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.25 })
          );
          mainGroup.add(line);
        });
      });
    } else {
      // 3B. 3D LOSS LANDSCAPE HYPERSURFACE VIEW
      const size = 60;
      const segs = 36;
      const lossGeo = new THREE.PlaneGeometry(size, size, segs, segs);
      lossGeo.rotateX(-Math.PI / 2);

      const positions = lossGeo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const vx = positions.getX(i);
        const vz = positions.getZ(i);

        // Convex loss basin with localized ripples (Navier-Stokes regularization)
        const dist = Math.sqrt(vx * vx + vz * vz);
        const lossY = (dist / 30) ** 2 * 18 + Math.sin(vx * 0.3) * Math.cos(vz * 0.3) * 2.2;

        positions.setY(i, lossY);
      }
      lossGeo.computeVertexNormals();

      const lossMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        wireframe: true,
        roughness: 0.3,
        metalness: 0.5,
      });
      const lossMesh = new THREE.Mesh(lossGeo, lossMat);
      lossMesh.position.y = -6;
      mainGroup.add(lossMesh);

      // Trajectory convergence point (CRPS Minimum)
      const minGeo = new THREE.SphereGeometry(2.0, 16, 16);
      const minMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const minMesh = new THREE.Mesh(minGeo, minMat);
      minMesh.position.set(0, -6, 0);
      mainGroup.add(minMesh);

      // Optimization trajectory curve
      const trajPoints = [
        new THREE.Vector3(-22, 10, -20),
        new THREE.Vector3(-14, 2, -10),
        new THREE.Vector3(-6, -3, -4),
        new THREE.Vector3(0, -6, 0),
      ];
      const trajCurve = new THREE.CatmullRomCurve3(trajPoints);
      const trajGeo = new THREE.BufferGeometry().setFromPoints(trajCurve.getPoints(30));
      const trajLine = new THREE.Line(
        trajGeo,
        new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 })
      );
      mainGroup.add(trajLine);
    }

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(40, 50, 40);
    scene.add(dir);

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
      groupRef.current.rotation.x = Math.max(-0.4, Math.min(0.6, groupRef.current.rotation.x + dy * 0.005));

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

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Animate synaptic signal pulses
      pulsingPackets.forEach((p) => {
        p.progress += 0.015;
        if (p.progress > 1) p.progress = 0;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      });

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
    };
  }, [viewMode]);

  const resetView = () => {
    if (!groupRef.current || !cameraRef.current) return;
    groupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 45, 90);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            3D Spatiotemporal PINN Architecture // 14.2M Parameters
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("network")}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === "network"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Neural Graph
          </button>

          <button
            onClick={() => setViewMode("lossLandscape")}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === "lossLandscape"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            CRPS Loss Manifold
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

      {/* Architecture Explanation Footer */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {viewMode === "network" ? (
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Inputs
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Spatiotemporal Conv
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> TCN Causal Conv
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Navier-Stokes PINN Loss
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Quantile Envelopes
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-amber-400 font-bold">Gradient Descent Trajectory:</span>
            <span>Converging to Global CRPS Minima = 0.118 at Epoch 142</span>
          </div>
        )}

        <div className="text-[11px] font-mono text-slate-400">
          Latency: <span className="text-cyan-400 font-bold">45ms</span> | Brier Score: <span className="text-emerald-400 font-bold">0.082</span>
        </div>
      </div>
    </div>
  );
};
