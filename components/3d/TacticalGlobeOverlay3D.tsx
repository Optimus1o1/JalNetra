"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { IOT_SENSOR_NODES } from "@/lib/data/sensorNodesData";
import { GridCell } from "@/lib/types";
import { Compass, RotateCw, Layers, Radio, ShieldAlert } from "lucide-react";

interface TacticalGlobeOverlay3DProps {
  onSelectWard?: (wardNumber: number) => void;
}

export const TacticalGlobeOverlay3D: React.FC<TacticalGlobeOverlay3DProps> = ({ onSelectWard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const hoveredCellRef = useRef<GridCell | null>(null);
  const onSelectWardRef = useRef(onSelectWard);
  onSelectWardRef.current = onSelectWard;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const sweepBeamRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 90, 130);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Main Tactical Group
    const tacticalGroup = new THREE.Group();
    groupRef.current = tacticalGroup;
    scene.add(tacticalGroup);

    // 3a. Tactical Grid & Embankment Base
    const gridHelper = new THREE.GridHelper(120, 24, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.5;
    tacticalGroup.add(gridHelper);

    // 3b. Hooghly River S-Curve Path (3D Ribbon)
    const riverPoints = [
      new THREE.Vector3(-45, 0.1, -45),
      new THREE.Vector3(-35, 0.1, -25),
      new THREE.Vector3(-28, 0.1, -5),
      new THREE.Vector3(-32, 0.1, 15),
      new THREE.Vector3(-42, 0.1, 45),
    ];
    const riverCurve = new THREE.CatmullRomCurve3(riverPoints);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 32, 3.5, 8, false);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.4,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    tacticalGroup.add(riverMesh);

    // 3c. 3D Ward Hexagon/Cylinder Columns
    const centerLat = 22.54;
    const centerLon = 88.36;
    const scale = 1100;

    const wardMeshes: { mesh: THREE.Mesh; cell: GridCell }[] = [];

    PILOT_GRID_CELLS.forEach((cell) => {
      const x = (cell.coordinates[1] - centerLon) * scale;
      const z = -(cell.coordinates[0] - centerLat) * scale;
      const height = 4 + cell.riskScore * 18;

      const colGeo = new THREE.CylinderGeometry(4.5, 4.5, height, 6);
      const colColor =
        cell.riskScore >= 0.75 ? 0xef4444 : cell.riskScore >= 0.5 ? 0xf59e0b : 0x06b6d4;

      const colMat = new THREE.MeshStandardMaterial({
        color: colColor,
        emissive: colColor,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.85,
        metalness: 0.4,
        roughness: 0.3,
      });

      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.set(x, height / 2, z);
      tacticalGroup.add(colMesh);

      // Wireframe outline for high-density HUD aesthetic
      const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.15 });
      const wireMesh = new THREE.Mesh(colGeo, wireMat);
      colMesh.add(wireMesh);

      wardMeshes.push({ mesh: colMesh, cell });
    });

    // 3d. IoT Sensor Floating Beacons
    IOT_SENSOR_NODES.forEach((s) => {
      const x = (s.coordinates[1] - centerLon) * scale;
      const z = -(s.coordinates[0] - centerLat) * scale;

      const sGeo = new THREE.OctahedronGeometry(1.4);
      const sMat = new THREE.MeshBasicMaterial({
        color: s.status === "online" ? 0x10b981 : 0xf59e0b,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(x, 22, z);
      tacticalGroup.add(sMesh);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(1.6, 2.8, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: s.status === "online" ? 0x10b981 : 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(x, 22, z);
      tacticalGroup.add(ringMesh);
    });

    // 3e. 3D Radar Sweep Line
    const sweepGeo = new THREE.ConeGeometry(55, 1, 32, 1, true, 0, Math.PI / 8);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.position.y = 0.2;
    tacticalGroup.add(sweepMesh);
    sweepBeamRef.current = sweepMesh;

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(40, 60, 40);
    scene.add(dir);

    // 4. Pointer Drag Controls & Raycaster
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevX = cx;
      prevY = cy;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (isDragging && groupRef.current) {
        const dx = cx - prevX;
        const dy = cy - prevY;

        groupRef.current.rotation.y += dx * 0.007;
        groupRef.current.rotation.x = Math.max(-0.2, Math.min(0.6, groupRef.current.rotation.x + dy * 0.005));

        prevX = cx;
        prevY = cy;
      }

      // Raycast hover detection
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(wardMeshes.map((w) => w.mesh));

      if (intersects.length > 0) {
        const hit = wardMeshes.find((w) => w.mesh === intersects[0].object);
        if (hit) {
          setHoveredCell(hit.cell);
          hoveredCellRef.current = hit.cell;
          renderer.domElement.style.cursor = "pointer";
        }
      } else {
        setHoveredCell(null);
        hoveredCellRef.current = null;
        renderer.domElement.style.cursor = isDragging ? "grabbing" : "grab";
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickMouse, camera);
      const intersects = raycaster.intersectObjects(wardMeshes.map((w) => w.mesh));
      if (intersects.length > 0) {
        const hit = wardMeshes.find((w) => w.mesh === intersects[0].object);
        if (hit && onSelectWardRef.current) {
          onSelectWardRef.current(hit.cell.wardNumber);
          return;
        }
      }
      if (hoveredCellRef.current && onSelectWardRef.current) {
        onSelectWardRef.current(hoveredCellRef.current.wardNumber);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    domElement.addEventListener("click", handleClick);
    domElement.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    // 5. Animation Loop
    let animationFrameId: number;
    let angle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      angle += 0.03;

      if (sweepBeamRef.current) {
        sweepBeamRef.current.rotation.y = angle;
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
      domElement.removeEventListener("click", handleClick);
      domElement.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      resizeObserver.disconnect();
      renderer.dispose();
      gridHelper.dispose();
      riverGeo.dispose();
      riverMat.dispose();
    };
  }, [onSelectWard, hoveredCell]);

  const resetView = () => {
    if (!groupRef.current || !cameraRef.current) return;
    groupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 90, 130);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            3D Tactical Orthographic Twin // Greater Kolkata Basin
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
        className="w-full h-[400px] sm:h-[480px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Hovered Ward Readout Overlay */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {hoveredCell ? (
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-100 font-sans">
              Ward {hoveredCell.wardNumber}: {hoveredCell.wardName}
            </span>
            <span className="text-cyan-400">Elevation: {hoveredCell.elevation}m</span>
            <span className="text-amber-400">Imperviousness: {hoveredCell.imperviousness}%</span>
            <span className={hoveredCell.riskScore >= 0.75 ? "text-rose-400 font-bold" : "text-emerald-400"}>
              Risk: {hoveredCell.riskScore.toFixed(2)}
            </span>
          </div>
        ) : (
          <div className="text-slate-400">Hover over any 3D ward pillar to inspect live digital twin telemetry. Click to inspect drawer.</div>
        )}

        <div className="text-slate-500 text-[11px]">
          Hooghly Estuary (Ribbon) + 12 Ward Columns
        </div>
      </div>
    </div>
  );
};
