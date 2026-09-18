"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { PILOT_GRID_CELLS } from "@/lib/data/pilotRegionData";
import { GridCell } from "@/lib/types";
import {
  Mountain,
  Layers,
  Compass,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  AlertTriangle,
  Hospital,
  ShieldCheck,
  Waves,
  MapPin,
  Maximize2,
} from "lucide-react";
import { Badge } from "../ui/Badge";

interface TopographicBasin3DProps {
  onSelectWard?: (wardNumber: number) => void;
}

type ViewMode = "elevation" | "risk" | "inundation";
type CameraPreset = "orbit" | "topdown" | "profile";

export const TopographicBasin3D: React.FC<TopographicBasin3DProps> = ({ onSelectWard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floodPlaneM, setFloodPlaneM] = useState<number>(3.5); // Meters MSL (default monsoonal stage)
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(PILOT_GRID_CELLS[0]);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("risk");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("orbit");
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // References for live Three.js synchronization (prevents closure staleness)
  const floodPlaneRef = useRef<number>(floodPlaneM);
  floodPlaneRef.current = floodPlaneM;

  const viewModeRef = useRef<ViewMode>(viewMode);
  viewModeRef.current = viewMode;

  const isAutoRotatingRef = useRef<boolean>(isAutoRotating);
  isAutoRotatingRef.current = isAutoRotating;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const waterPlaneRef = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const beaconMeshesRef = useRef<{ mesh: THREE.Mesh; halo: THREE.Mesh; cell: GridCell; pillar: THREE.Mesh }[]>([]);
  const rippleRingsRef = useRef<{ ring: THREE.Mesh; cell: GridCell }[]>([]);
  const targetHighlightRef = useRef<THREE.Mesh | null>(null);

  // Derived Real-time Submersion Calculations
  const submersionStats = useMemo(() => {
    const submerged = PILOT_GRID_CELLS.filter((c) => c.elevation <= floodPlaneM);
    const safe = PILOT_GRID_CELLS.filter((c) => c.elevation > floodPlaneM);

    const affectedHospitals = submerged.flatMap((c) => c.criticalAssets.hospitals);
    const affectedPumps = submerged.flatMap((c) => c.criticalAssets.pumpingStations);
    const affectedPopulation = submerged.reduce((acc, c) => acc + c.populationDensity * 1.5, 0); // Approx 1.5 km² per ward
    const inundatedAreaKm2 = Number((submerged.length * 1.6).toFixed(1));

    return {
      submergedCount: submerged.length,
      totalCount: PILOT_GRID_CELLS.length,
      submergedWards: submerged,
      safeWards: safe,
      affectedHospitals,
      affectedPumps,
      affectedPopulation: Math.round(affectedPopulation),
      inundatedAreaKm2,
    };
  }, [floodPlaneM]);

  // Color helper based on active view mode
  const getCellColorHex = useCallback((cell: GridCell, mode: ViewMode): number => {
    if (mode === "inundation") {
      if (cell.elevation <= floodPlaneRef.current) {
        const depth = floodPlaneRef.current - cell.elevation;
        return depth > 1.2 ? 0xef4444 : depth > 0.4 ? 0xf59e0b : 0x06b6d4;
      }
      return 0x10b981; // Safe green
    }

    if (mode === "elevation") {
      // High: 7m+ (Emerald/Cyan), Mid: 5-7m (Teal/Blue), Low: <5m (Amber/Red)
      if (cell.elevation >= 6.5) return 0x10b981;
      if (cell.elevation >= 5.0) return 0x06b6d4;
      if (cell.elevation >= 4.0) return 0xf59e0b;
      return 0xef4444;
    }

    // Default Risk Mode
    if (cell.riskScore >= 0.75) return 0xef4444; // Critical Red
    if (cell.riskScore >= 0.55) return 0xf59e0b; // High Amber
    if (cell.riskScore >= 0.4) return 0x06b6d4;  // Medium Cyan
    return 0x10b981; // Low Green
  }, []);

  // Sync color changes across all pillars and beacons
  const update3DColors = useCallback(() => {
    beaconMeshesRef.current.forEach(({ mesh, halo, cell, pillar }) => {
      const colorHex = getCellColorHex(cell, viewModeRef.current);
      const isSubmerged = cell.elevation <= floodPlaneRef.current;

      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.setHex(colorHex);
        mesh.material.emissive.setHex(isSubmerged ? 0xef4444 : colorHex);
        mesh.material.emissiveIntensity = isSubmerged ? 0.7 : 0.35;
      }

      if (halo.material instanceof THREE.MeshBasicMaterial) {
        halo.material.color.setHex(isSubmerged ? 0xff0055 : colorHex);
      }

      if (pillar.material instanceof THREE.MeshStandardMaterial) {
        pillar.material.color.setHex(isSubmerged ? 0x991b1b : 0x1e293b);
        pillar.material.emissive.setHex(isSubmerged ? 0xef4444 : 0x0f172a);
        pillar.material.emissiveIntensity = isSubmerged ? 0.25 : 0.05;
      }
    });
  }, [getCellColorHex]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 460;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 85, 130);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Terrain Group
    const terrainGroup = new THREE.Group();
    groupRef.current = terrainGroup;
    scene.add(terrainGroup);

    // 3a. Realistic Kolkata Digital Elevation Model (DEM) Grid
    const terrainSize = 110;
    const segments = 48;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    // Morph vertices to match authentic Kolkata Topography:
    // High bank along Hooghly River on West (-X ~ 6.5-7.8m), sloped down toward East Wetlands (+X ~ 2.5-3.8m)
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Eastward natural gravity gradient toward wetlands
      const eastDip = (vx / 55) * -3.2;
      // High river levee along western bank
      const westLevee = vx < -25 ? Math.exp(-Math.pow((vx + 45) / 16, 2)) * 3.2 : 0;
      // Monikhali / Tolly's Nullah canal drainage channel depression
      const canalDepression = Math.exp(-Math.pow((vz - 5) / 12, 2)) * -1.2;
      // Micro-topographic drainage bumps
      const localNoise = Math.sin(vx * 0.12) * Math.cos(vz * 0.12) * 1.1;

      const vy = Math.max(0.6, 5.0 + eastDip + westLevee + canalDepression + localNoise);
      pos.setY(i, vy);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.88,
      metalness: 0.12,
      wireframe: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainGroup.add(terrainMesh);

    // Subtle Elevation Contour Wireframe Overlay
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const terrainWire = new THREE.Mesh(terrainGeo, wireframeMat);
    terrainWire.position.y += 0.04;
    terrainGroup.add(terrainWire);

    // Western Hooghly River Channel Indicator
    const riverGeo = new THREE.PlaneGeometry(16, terrainSize, 8, 16);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.55,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(-48, 1.2, 0);
    terrainGroup.add(riverMesh);

    // 3b. Interactive 3D Water Inundation Plane
    const waterGeo = new THREE.PlaneGeometry(terrainSize + 10, terrainSize + 10, 24, 24);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.62,
      roughness: 0.08,
      metalness: 0.35,
    });
    const waterPlane = new THREE.Mesh(waterGeo, waterMat);
    waterPlane.position.y = floodPlaneRef.current * 1.8;
    terrainGroup.add(waterPlane);
    waterPlaneRef.current = waterPlane;

    // 3c. 3D Ward Pillars, Beacons & Water-Line Ripple Rings
    beaconMeshesRef.current = [];
    rippleRingsRef.current = [];

    const centerLat = 22.545;
    const centerLon = 88.36;
    const latScale = 750;
    const lonScale = 750;

    PILOT_GRID_CELLS.forEach((cell) => {
      const x = (cell.coordinates[1] - centerLon) * lonScale;
      const z = -(cell.coordinates[0] - centerLat) * latScale;
      const y = cell.elevation * 1.8;

      const pillarHeight = Math.max(3.5, y);
      const pillarGeo = new THREE.CylinderGeometry(1.2, 1.6, pillarHeight, 16);

      const colorHex = getCellColorHex(cell, viewModeRef.current);

      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.2,
      });

      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, pillarHeight / 2, z);
      terrainGroup.add(pillar);

      // Floating beacon sphere on top
      const beaconGeo = new THREE.SphereGeometry(1.5, 16, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.5,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(x, pillarHeight + 1.8, z);
      // Store cell reference directly on the userData object for raycasting
      beacon.userData = { cell };
      terrainGroup.add(beacon);

      // Outer pulsating glow halo
      const haloGeo = new THREE.SphereGeometry(2.3, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(x, pillarHeight + 1.8, z);
      terrainGroup.add(halo);

      // Inundation water ripple ring around pillar
      const ringGeo = new THREE.RingGeometry(1.8, 3.2, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y + 0.1, z);
      terrainGroup.add(ring);

      beaconMeshesRef.current.push({ mesh: beacon, halo, cell, pillar });
      rippleRingsRef.current.push({ ring, cell });
    });

    // 3d. Active Selected Ward Target Spotlight Ring
    const targetGeo = new THREE.RingGeometry(3.5, 4.8, 32);
    targetGeo.rotateX(-Math.PI / 2);
    const targetMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const targetRing = new THREE.Mesh(targetGeo, targetMat);
    targetRing.position.set(0, -100, 0); // Hide until selected
    terrainGroup.add(targetRing);
    targetHighlightRef.current = targetRing;

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    sunLight.position.set(50, 80, 60);
    scene.add(sunLight);

    const riverFill = new THREE.DirectionalLight(0x0284c7, 0.6);
    riverFill.position.set(-60, 30, -30);
    scene.add(riverFill);

    // 5. Raycasting for Hover & Click Picking in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastHit = (event: MouseEvent): { mesh: THREE.Mesh; cell: GridCell } | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const beaconTargets = beaconMeshesRef.current.map((b) => b.mesh);
      const intersects = raycaster.intersectObjects(beaconTargets, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const cell = hitMesh.userData.cell as GridCell;
        return { mesh: hitMesh, cell };
      }
      return null;
    };

    // Pointer Interaction Event Handlers
    let isDragging = false;
    let hasMoved = false;
    let prevX = 0;
    let prevY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      hasMoved = false;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevX = cx;
      prevY = cy;
    };

    const handlePointerMove = (e: MouseEvent) => {
      // 1. Raycast for hover state if not dragging
      if (!isDragging) {
        const hit = getRaycastHit(e);
        if (hit) {
          setHoveredCell(hit.cell);
          const rect = renderer.domElement.getBoundingClientRect();
          setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top - 15,
          });
          renderer.domElement.style.cursor = "pointer";
        } else {
          setHoveredCell(null);
          setTooltipPos(null);
          renderer.domElement.style.cursor = "grab";
        }
      }

      // 2. Drag Orbit Rotation
      if (isDragging && groupRef.current) {
        hasMoved = true;
        const cx = e.clientX;
        const cy = e.clientY;
        const dx = cx - prevX;
        const dy = cy - prevY;

        groupRef.current.rotation.y += dx * 0.007;
        groupRef.current.rotation.x = Math.max(0.05, Math.min(1.2, groupRef.current.rotation.x + dy * 0.005));

        prevX = cx;
        prevY = cy;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !groupRef.current) return;
      hasMoved = true;
      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;
      const dx = cx - prevX;
      const dy = cy - prevY;

      groupRef.current.rotation.y += dx * 0.007;
      groupRef.current.rotation.x = Math.max(0.05, Math.min(1.2, groupRef.current.rotation.x + dy * 0.005));

      prevX = cx;
      prevY = cy;
    };

    const handlePointerUp = (e: MouseEvent) => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";

      // If clicked without dragging, select the hovered ward
      if (!hasMoved) {
        const hit = getRaycastHit(e);
        if (hit) {
          setSelectedCell(hit.cell);
          onSelectWard?.(hit.cell.wardNumber);
        }
      }
    };

    // Mouse Wheel Zoom (with preventDefault to avoid scrolling the webpage)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.08;
      const newDistance = THREE.MathUtils.clamp(cameraRef.current.position.z + zoomDelta, 60, 240);
      cameraRef.current.position.z = newDistance;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    domElement.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", () => { isDragging = false; });
    domElement.addEventListener("wheel", handleWheel, { passive: false });

    // 6. Animation Loop with Ripple and Wave Effects
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.025;

      // Auto-rotation if enabled
      if (isAutoRotatingRef.current && groupRef.current) {
        groupRef.current.rotation.y += 0.003;
      }

      // Smooth Dynamic Water Plane Elevation (fixes stale closure!)
      const targetWaterY = floodPlaneRef.current * 1.8;
      if (waterPlaneRef.current) {
        waterPlaneRef.current.position.y = THREE.MathUtils.lerp(
          waterPlaneRef.current.position.y,
          targetWaterY + Math.sin(time * 1.5) * 0.1,
          0.1
        );
      }

      // Animate Beacon Floating and Water Overtopping Rings
      beaconMeshesRef.current.forEach(({ mesh, halo, cell }) => {
        mesh.position.y = cell.elevation * 1.8 + 1.8 + Math.sin(time * 2 + cell.wardNumber) * 0.15;
        halo.position.y = mesh.position.y;
        halo.rotation.y += 0.02;

        // Scale beacon slightly if hovered
        const isHovered = hoveredCell?.id === cell.id;
        const targetScale = isHovered ? 1.35 : 1.0;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      });

      // Animate Submerged Water Ripple Rings
      rippleRingsRef.current.forEach(({ ring, cell }) => {
        const isSubmerged = cell.elevation <= floodPlaneRef.current;
        if (isSubmerged) {
          ring.position.y = waterPlaneRef.current ? waterPlaneRef.current.position.y + 0.05 : cell.elevation * 1.8;
          const scalePulse = 1.0 + Math.sin(time * 3 + cell.wardNumber) * 0.35;
          ring.scale.set(scalePulse, scalePulse, 1);
          if (ring.material instanceof THREE.MeshBasicMaterial) {
            ring.material.opacity = 0.45 + Math.sin(time * 3) * 0.25;
          }
        } else {
          if (ring.material instanceof THREE.MeshBasicMaterial) {
            ring.material.opacity = 0.0;
          }
        }
      });

      // Target Highlight Ring Rotation & Positioning
      if (targetHighlightRef.current && selectedCell) {
        const selMesh = beaconMeshesRef.current.find((b) => b.cell.id === selectedCell.id);
        if (selMesh) {
          targetHighlightRef.current.position.set(
            selMesh.mesh.position.x,
            selectedCell.elevation * 1.8 + 0.1,
            selMesh.mesh.position.z
          );
          targetHighlightRef.current.rotation.z += 0.015;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Observer
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
      window.removeEventListener("touchmove", handleTouchMove);
      domElement.removeEventListener("wheel", handleWheel);
      resizeObserver.disconnect();
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
    };
  }, []);

  // Update colors whenever viewMode or flood stage changes
  useEffect(() => {
    update3DColors();
  }, [viewMode, floodPlaneM, update3DColors]);

  // Handle Water Stage Change
  const handleWaterLevelChange = (m: number) => {
    setFloodPlaneM(m);
  };

  // Camera Presets
  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!cameraRef.current || !groupRef.current) return;

    if (preset === "orbit") {
      cameraRef.current.position.set(0, 85, 130);
      groupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.lookAt(0, 5, 0);
    } else if (preset === "topdown") {
      cameraRef.current.position.set(0, 160, 1);
      groupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.lookAt(0, 0, 0);
    } else if (preset === "profile") {
      cameraRef.current.position.set(-135, 35, 0);
      groupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.lookAt(0, 5, 0);
    }
  };

  // Zoom Helpers
  const zoomIn = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(60, cameraRef.current.position.z - 20);
  };

  const zoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.min(220, cameraRef.current.position.z + 20);
  };

  const resetView = () => {
    applyCameraPreset("orbit");
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-950/90 border border-cyan-500/25 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* ========================================================================= */}
      {/* TOP HUD: MISSION STATUS & VIEW CONTROLS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/80 gap-3 z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold text-slate-100 tracking-wide">
                Digital Elevation Model (DEM) & Basin Depression Sandbox
              </span>
              <Badge variant="cyan" size="sm">
                3D SPATIAL TWIN
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Hover or click wards in 3D · Rotate with drag · Zoom with mouse wheel
            </span>
          </div>
        </div>

        {/* View Mode Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode("risk")}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === "risk"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Color wards by composite vulnerability risk"
          >
            Risk Heatmap
          </button>
          <button
            onClick={() => setViewMode("elevation")}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === "elevation"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Color terrain and wards by physical ground elevation"
          >
            DEM Topography
          </button>
          <button
            onClick={() => setViewMode("inundation")}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === "inundation"
                ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Highlight active submerged vs dry areas at current flood stage"
          >
            Inundation Stage
          </button>
        </div>

        {/* Camera Angle & Interaction Tools */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
            <button
              onClick={() => applyCameraPreset("orbit")}
              className={`px-2 py-0.5 rounded ${cameraPreset === "orbit" ? "text-cyan-300 font-bold bg-slate-800" : "hover:text-slate-200"}`}
            >
              3D Orbit
            </button>
            <button
              onClick={() => applyCameraPreset("topdown")}
              className={`px-2 py-0.5 rounded ${cameraPreset === "topdown" ? "text-cyan-300 font-bold bg-slate-800" : "hover:text-slate-200"}`}
            >
              Top-Down
            </button>
            <button
              onClick={() => applyCameraPreset("profile")}
              className={`px-2 py-0.5 rounded ${cameraPreset === "profile" ? "text-cyan-300 font-bold bg-slate-800" : "hover:text-slate-200"}`}
            >
              River Profile
            </button>
          </div>

          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            title={isAutoRotating ? "Pause Orbit" : "Auto Rotate 3D"}
            className={`p-1.5 rounded-lg border transition ${
              isAutoRotating
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetView}
            title="Reset Camera View"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMULATED FLOOD PLANE CONTROL & SCENARIO PRESETS BAR */}
      {/* ========================================================================= */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">Simulated Water Stage:</span>
            <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
              {floodPlaneM.toFixed(1)} m MSL
            </span>
          </div>

          <input
            type="range"
            min="1.5"
            max="6.5"
            step="0.1"
            value={floodPlaneM}
            onChange={(e) => handleWaterLevelChange(parseFloat(e.target.value))}
            className="w-36 sm:w-52 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Flood Scenario Quick Presets */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 hidden sm:inline">Tidal Presets:</span>
          <button
            onClick={() => handleWaterLevelChange(1.8)}
            className={`px-2 py-0.5 rounded transition ${
              floodPlaneM === 1.8 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Low Tide (1.8m)
          </button>
          <button
            onClick={() => handleWaterLevelChange(3.5)}
            className={`px-2 py-0.5 rounded transition ${
              floodPlaneM === 3.5 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Monsoon High Tide (3.5m)
          </button>
          <button
            onClick={() => handleWaterLevelChange(4.5)}
            className={`px-2 py-0.5 rounded transition ${
              floodPlaneM === 4.5 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Storm Surge (4.5m)
          </button>
          <button
            onClick={() => handleWaterLevelChange(5.8)}
            className={`px-2 py-0.5 rounded transition ${
              floodPlaneM === 5.8 ? "bg-rose-600 text-white font-bold" : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Supercyclone (5.8m)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3D WEBGL VIEWPORT WITH FLOATING RAYCAST HUD TOOLTIP */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[380px] sm:h-[440px] cursor-grab active:cursor-grabbing">
        <div ref={containerRef} className="w-full h-full" />

        {/* 3D Compass Legend Overlay */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1 font-mono text-[10px] text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 backdrop-blur-md">
          <div className="text-cyan-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Kolkata Basin Topography</span>
          </div>
          <div className="text-slate-300">West: Hooghly River Levee (~7.2m)</div>
          <div className="text-slate-400">East: Wetland Retention Sinks (~3.6m)</div>
          <div className="text-[9px] text-slate-500 mt-1">Waterline scales dynamically with stage</div>
        </div>

        {/* Floating 3D Hover Tooltip */}
        {hoveredCell && tooltipPos && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 600) - 220)}px`,
              top: `${Math.max(10, tooltipPos.y - 120)}px`,
            }}
            className="pointer-events-none z-30 p-2.5 rounded-lg bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200 space-y-1 w-52 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-bold text-white font-sans">
                Ward {hoveredCell.wardNumber}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                hoveredCell.elevation <= floodPlaneM
                  ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
              }`}>
                {hoveredCell.elevation <= floodPlaneM ? "SUBMERGED" : "DRY"}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">{hoveredCell.wardName}</div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Elevation:</span>
              <span className="text-cyan-300 font-bold">{hoveredCell.elevation}m MSL</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Water Depth:</span>
              <span className={`font-bold ${hoveredCell.elevation <= floodPlaneM ? "text-rose-400" : "text-slate-400"}`}>
                {hoveredCell.elevation <= floodPlaneM
                  ? `+${(floodPlaneM - hoveredCell.elevation).toFixed(2)}m water`
                  : `Safe by ${(hoveredCell.elevation - floodPlaneM).toFixed(2)}m`}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Risk Score:</span>
              <span className="text-amber-300 font-bold">{hoveredCell.riskScore.toFixed(2)}</span>
            </div>
            <div className="text-[9px] text-slate-500 pt-0.5">Click to lock & view diagnostics</div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME IMPACT COUNTERS AT CURRENT SIMULATED WATER STAGE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-900/90 border-t border-slate-800 font-mono text-xs">
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Submerged Wards</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-bold telemetry-num ${
              submersionStats.submergedCount > 4 ? "text-rose-400" : submersionStats.submergedCount > 0 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {submersionStats.submergedCount} / {submersionStats.totalCount}
            </span>
            <span className="text-[10px] text-slate-500">Wards Breached</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Inundated Footprint</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-cyan-300 telemetry-num">
              {submersionStats.inundatedAreaKm2} <span className="text-xs font-normal text-slate-400">km²</span>
            </span>
            <span className="text-[10px] text-slate-500">Basin Area</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Hospitals Threatened</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-bold telemetry-num ${
              submersionStats.affectedHospitals.length > 0 ? "text-rose-400" : "text-emerald-400"
            }`}>
              {submersionStats.affectedHospitals.length}
            </span>
            <span className="text-[10px] text-slate-500">Apex Facilities</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Pumps in Submerged Zones</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-bold telemetry-num ${
              submersionStats.affectedPumps.length > 0 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {submersionStats.affectedPumps.length}
            </span>
            <span className="text-[10px] text-slate-500">Stations Trapped</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ALL 12 WARDS INTERACTIVE SELECTOR DECK WITH LIVE SUBMERSION STATUS */}
      {/* ========================================================================= */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>KMC Pilot Wards (Color coded by active state at {floodPlaneM.toFixed(1)}m MSL):</span>
          <span className="text-cyan-400 font-semibold">Click any ward to isolate in 3D</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {PILOT_GRID_CELLS.map((cell) => {
            const isSubmerged = cell.elevation <= floodPlaneM;
            const isSelected = selectedCell?.id === cell.id;

            return (
              <button
                key={cell.id}
                onClick={() => {
                  setSelectedCell(cell);
                  onSelectWard?.(cell.wardNumber);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left flex items-center justify-between border ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-900/30"
                    : isSubmerged
                    ? "bg-rose-950/40 border-rose-900/60 text-rose-300 hover:bg-rose-900/40"
                    : "bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="truncate pr-1">
                  <div className="font-bold text-[11px]">W-{cell.wardNumber}</div>
                  <div className="text-[10px] text-slate-400 truncate">{cell.wardName.split("/")[0]}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-cyan-300">{cell.elevation}m</div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSubmerged ? "bg-rose-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className={`text-[9px] ${isSubmerged ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                      {isSubmerged ? "DROWN" : "DRY"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTED WARD ACTIVE TELEMETRY CARD */}
      {/* ========================================================================= */}
      {selectedCell && (
        <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${
              selectedCell.elevation <= floodPlaneM
                ? "bg-rose-950/60 border-rose-500/40 text-rose-400"
                : "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-sans">{selectedCell.wardName}</span>
                <Badge variant={selectedCell.alertStatus === "critical" ? "rose" : selectedCell.alertStatus === "high" ? "amber" : "cyan"} size="sm">
                  {selectedCell.alertStatus.toUpperCase()}
                </Badge>
                <span className="text-slate-400 text-[11px]">({selectedCell.borough})</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>Elevation: <strong className="text-cyan-300">{selectedCell.elevation}m MSL</strong></span>
                <span>Impervious: <strong className="text-amber-300">{selectedCell.imperviousness}%</strong></span>
                <span>Drainage: <strong className="text-slate-200">{selectedCell.drainageCapacity} mm/h</strong></span>
                <span>Composite Risk: <strong className="text-rose-300">{selectedCell.riskScore.toFixed(2)}</strong></span>
              </div>
            </div>
          </div>

          {/* Submersion Status Callout */}
          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
            selectedCell.elevation <= floodPlaneM
              ? "bg-rose-950/70 border-rose-500/40 text-rose-300"
              : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
          }`}>
            {selectedCell.elevation <= floodPlaneM ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">CRITICAL INUNDATION BREACH</div>
                  <div className="text-[10px] text-rose-200">
                    Water head exceeds ground by +{(floodPlaneM - selectedCell.elevation).toFixed(2)}m (Ponding expected)
                  </div>
                </div>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">GRAVITY DRAINAGE FUNCTIONAL</div>
                  <div className="text-[10px] text-emerald-200">
                    Freeboard margin: {(selectedCell.elevation - floodPlaneM).toFixed(2)}m safe above flood stage
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
