"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, AlertTriangle } from "lucide-react";

interface Hydrograph3DProps {
  scrubIndex?: number;
  onSelectScrubIndex?: (index: number) => void;
  isPlaying?: boolean;
  className?: string;
}

export const Hydrograph3D: React.FC<Hydrograph3DProps> = ({
  scrubIndex = 4,
  onSelectScrubIndex: _onSelectScrubIndex,
  isPlaying: _isPlaying = false,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeCameraView, setActiveCameraView] = useState<"iso" | "front" | "top">("iso");
  const [hoveredData, setHoveredData] = useState<{
    timeLabel: string;
    stageM: number;
    qpeMm: number;
    status: string;
  } | null>(null);

  // References to animate time cursor smoothly
  const timeCursorGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Time slice reference mapping: index 0..8 -> X coordinate (-12 to +12)
  const sliceXPositions = [-12, -9, -6, -3, 0, 3, 6, 9, 12];
  const sliceLabels = ["-12h", "-9h", "-6h", "-3h", "T_0 NOW", "+3h", "+6h", "+9h", "+12h"];
  const sliceStages = [1.2, 1.35, 1.7, 2.1, 2.45, 2.92, 3.1, 2.55, 1.85];
  const sliceRain = [15, 22, 35, 48, 52, 58, 64, 38, 18];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x05080e);
    scene.fog = new THREE.FogExp2(0x05080e, 0.022);

    // 2. Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 280;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 7, 22);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(12, 24, 16);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 1.2);
    rimLight.position.set(-15, 10, -10);
    scene.add(rimLight);

    // Peak Breach Hazard Spot Light
    const breachSpot = new THREE.PointLight(0xef4444, 2.5, 15);
    breachSpot.position.set(5, 3.8, 0);
    scene.add(breachSpot);

    // 5. 3D Coordinate Grid & Floor Plane
    const gridGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(28, 28, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0;
    gridGroup.add(gridHelper);

    // Baseline axis line (MSL = 0.0m)
    const baseAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14, 0, 0),
      new THREE.Vector3(14, 0, 0),
    ]);
    const baseAxisMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const baseAxis = new THREE.Line(baseAxisGeo, baseAxisMat);
    gridGroup.add(baseAxis);

    // T_0 Divider Axis in Grid (X = 0)
    const t0LineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -4),
      new THREE.Vector3(0, 4.5, -4),
      new THREE.Vector3(0, 4.5, 4),
      new THREE.Vector3(0, 0, 4),
    ]);
    const t0LineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.4,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.4,
    });
    const t0Line = new THREE.Line(t0LineGeo, t0LineMat);
    t0Line.computeLineDistances();
    gridGroup.add(t0Line);

    scene.add(gridGroup);

    // 6. Critical Breach Threshold Plane (+2.80m MSL)
    const breachPlaneGeo = new THREE.PlaneGeometry(28, 7);
    breachPlaneGeo.rotateX(-Math.PI / 2);
    const breachPlaneMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const breachPlane = new THREE.Mesh(breachPlaneGeo, breachPlaneMat);
    breachPlane.position.set(0, 2.8, 0);
    scene.add(breachPlane);

    // Breach Wireframe Border
    const breachEdges = new THREE.EdgesGeometry(breachPlaneGeo);
    const breachLineMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75 });
    const breachOutline = new THREE.LineSegments(breachEdges, breachLineMat);
    breachOutline.position.set(0, 2.8, 0);
    scene.add(breachOutline);

    // 7. Volumetric Precipitation Radar Pillars (QPE mm/h)
    const pillarsGroup = new THREE.Group();
    const pillarHours = [-12, -10.5, -9, -7.5, -6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12];
    const pillarRainRates = [14, 18, 24, 32, 40, 48, 52, 55, 45, 50, 62, 68, 58, 42, 28, 20, 12];

    pillarHours.forEach((hourX, idx) => {
      const rainMm = pillarRainRates[idx];
      const pillarHeight = (rainMm / 70) * 3.6; // normalized 0..3.6m
      const isBreachRain = rainMm > 55;
      const isHeavyRain = rainMm > 35;

      const pillarColor = isBreachRain ? 0xef4444 : isHeavyRain ? 0xf59e0b : 0x0284c7;

      const boxGeo = new THREE.BoxGeometry(0.85, pillarHeight, 0.85);
      const boxMat = new THREE.MeshStandardMaterial({
        color: pillarColor,
        roughness: 0.25,
        metalness: 0.8,
        transparent: true,
        opacity: 0.65,
      });

      const pillarMesh = new THREE.Mesh(boxGeo, boxMat);
      // Position base on grid (Y=0), place behind the stage ribbon at Z = -1.8
      pillarMesh.position.set(hourX, pillarHeight / 2, -1.8);
      pillarsGroup.add(pillarMesh);

      // Edges for sharp high-tech look
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: pillarColor,
        transparent: true,
        opacity: 0.9,
      });
      const wireframe = new THREE.LineSegments(edges, edgesMat);
      wireframe.position.copy(pillarMesh.position);
      pillarsGroup.add(wireframe);
    });
    scene.add(pillarsGroup);

    // 8. Continuous Hydrodynamic Water Stage Ribbon
    const curvePoints = [
      new THREE.Vector3(-14, 1.1, 0),
      new THREE.Vector3(-12, 1.2, 0),
      new THREE.Vector3(-9, 1.35, 0),
      new THREE.Vector3(-6, 1.7, 0),
      new THREE.Vector3(-3, 2.1, 0),
      new THREE.Vector3(0, 2.45, 0), // T_0
      new THREE.Vector3(3, 2.92, 0), // Breach crossing
      new THREE.Vector3(5, 3.1, 0), // Apogee peak
      new THREE.Vector3(8, 2.65, 0),
      new THREE.Vector3(11, 2.0, 0),
      new THREE.Vector3(14, 1.6, 0),
    ];

    const hydroCurve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(hydroCurve, 120, 0.14, 12, false);

    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    // Water Stage Area Fill under the curve (Extruded Vertical Wall / Curtain)
    const points2D: THREE.Vector2[] = [new THREE.Vector2(-14, 0)];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const pt = hydroCurve.getPoint(t);
      points2D.push(new THREE.Vector2(pt.x, pt.y));
    }
    points2D.push(new THREE.Vector2(14, 0));

    const curtainShape = new THREE.Shape(points2D);
    const curtainGeo = new THREE.ShapeGeometry(curtainShape);
    const curtainMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
    scene.add(curtainMesh);

    // 9. P10 / P90 Forecast Uncertainty Canopy (For X > 0)
    const upperPoints: THREE.Vector3[] = [];
    const lowerPoints: THREE.Vector3[] = [];
    const forecastSteps = 30;
    for (let i = 0; i <= forecastSteps; i++) {
      const t = 0.5 + (i / forecastSteps) * 0.5;
      const pt = hydroCurve.getPoint(t);
      const uncertainty = Math.sin((i / forecastSteps) * Math.PI) * 0.55;
      upperPoints.push(new THREE.Vector3(pt.x, pt.y + uncertainty, 0.6));
      lowerPoints.push(new THREE.Vector3(pt.x, Math.max(0.8, pt.y - uncertainty * 0.8), -0.6));
    }

    const canopyGeo = new THREE.BufferGeometry();
    const canopyVerts: number[] = [];
    for (let i = 0; i < forecastSteps; i++) {
      const u1 = upperPoints[i];
      const u2 = upperPoints[i + 1];
      const l1 = lowerPoints[i];
      const l2 = lowerPoints[i + 1];

      canopyVerts.push(u1.x, u1.y, u1.z);
      canopyVerts.push(l1.x, l1.y, l1.z);
      canopyVerts.push(u2.x, u2.y, u2.z);

      canopyVerts.push(u2.x, u2.y, u2.z);
      canopyVerts.push(l1.x, l1.y, l1.z);
      canopyVerts.push(l2.x, l2.y, l2.z);
    }
    canopyGeo.setAttribute("position", new THREE.Float32BufferAttribute(canopyVerts, 3));
    canopyGeo.computeVertexNormals();

    const canopyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
    scene.add(canopyMesh);

    // 10. Apogee Peak Marker (+3.10m Hazard Beacon)
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(5, 3.1, 0);

    const beaconGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconGroup.add(beaconMesh);

    const haloRingGeo = new THREE.RingGeometry(0.45, 0.6, 24);
    haloRingGeo.rotateX(Math.PI / 2);
    const haloRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const haloRing = new THREE.Mesh(haloRingGeo, haloRingMat);
    beaconGroup.add(haloRing);

    scene.add(beaconGroup);

    // 11. Interactive Synchronized 3D Time Cursor
    const cursorGroup = new THREE.Group();
    const cursorLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -3),
      new THREE.Vector3(0, 4.4, -3),
      new THREE.Vector3(0, 4.4, 3),
      new THREE.Vector3(0, 0, 3),
    ]);
    const cursorLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const cursorBorder = new THREE.Line(cursorLineGeo, cursorLineMat);
    cursorGroup.add(cursorBorder);

    // Translucent cursor plane
    const cursorPlaneGeo = new THREE.PlaneGeometry(6, 4.4);
    cursorPlaneGeo.rotateY(Math.PI / 2);
    const cursorPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cursorPlane = new THREE.Mesh(cursorPlaneGeo, cursorPlaneMat);
    cursorPlane.position.y = 2.2;
    cursorGroup.add(cursorPlane);

    // Marker sphere at intersection with curve
    const cursorNodeGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const cursorNodeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.0,
    });
    const cursorNode = new THREE.Mesh(cursorNodeGeo, cursorNodeMat);
    cursorGroup.add(cursorNode);

    // Position initial cursor at scrubIndex
    const initialX = sliceXPositions[scrubIndex] ?? 0;
    cursorGroup.position.set(initialX, 0, 0);
    cursorNode.position.set(0, sliceStages[scrubIndex] ?? 2.45, 0);
    timeCursorGroupRef.current = cursorGroup;
    scene.add(cursorGroup);

    // 12. Orbital Mouse & Touch Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraAngle = 0;
    let cameraPitch = 0.32;
    let cameraRadius = 22;

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;
      const x = cameraRadius * Math.sin(cameraAngle) * Math.cos(cameraPitch);
      const y = cameraRadius * Math.sin(cameraPitch);
      const z = cameraRadius * Math.cos(cameraAngle) * Math.cos(cameraPitch);
      cameraRef.current.position.set(x, Math.max(1.5, y), z);
      cameraRef.current.lookAt(0, 1.8, 0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraAngle -= deltaX * 0.008;
      cameraPitch = Math.max(0.1, Math.min(1.4, cameraPitch + deltaY * 0.006));
      updateCameraPosition();
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRadius = Math.max(10, Math.min(36, cameraRadius + e.deltaY * 0.02));
      updateCameraPosition();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    domEl.addEventListener("wheel", handleWheel, { passive: false });

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        cameraAngle -= deltaX * 0.01;
        cameraPitch = Math.max(0.1, Math.min(1.4, cameraPitch + deltaY * 0.008));
        updateCameraPosition();
      }
    };
    domEl.addEventListener("touchstart", handleTouchStart);
    domEl.addEventListener("touchmove", handleTouchMove);

    // 13. Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Beacon pulse animation
      const pulseScale = 1.0 + Math.sin(elapsed * 4) * 0.2;
      beaconMesh.scale.set(pulseScale, pulseScale, pulseScale);
      haloRing.scale.set(pulseScale * 1.3, pulseScale * 1.3, 1);

      // Auto rotation
      if (autoRotate && !isDragging) {
        cameraAngle += delta * 0.2;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    // 14. Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 15. Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();

      domEl.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      domEl.removeEventListener("wheel", handleWheel);
      domEl.removeEventListener("touchstart", handleTouchStart);
      domEl.removeEventListener("touchmove", handleTouchMove);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      renderer.dispose();
      gridHelper.dispose();
      breachPlaneGeo.dispose();
      breachPlaneMat.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      curtainGeo.dispose();
      curtainMat.dispose();
      canopyGeo.dispose();
      canopyMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
    };
  }, [autoRotate]);

  // Synchronize 3D Time Cursor whenever scrubIndex changes
  useEffect(() => {
    if (!timeCursorGroupRef.current) return;
    const targetX = sliceXPositions[scrubIndex] ?? 0;
    const targetY = sliceStages[scrubIndex] ?? 2.45;

    timeCursorGroupRef.current.position.x = targetX;
    const node = timeCursorGroupRef.current.children[2];
    if (node) {
      node.position.y = targetY;
    }

    setHoveredData({
      timeLabel: sliceLabels[scrubIndex],
      stageM: sliceStages[scrubIndex],
      qpeMm: sliceRain[scrubIndex],
      status:
        sliceStages[scrubIndex] >= 2.8
          ? "CRITICAL BREACH"
          : sliceStages[scrubIndex] >= 2.0
          ? "SURGE ALERT"
          : "NOMINAL",
    });
  }, [scrubIndex]);

  const setCameraPreset = (view: "iso" | "front" | "top") => {
    if (!cameraRef.current) return;
    setActiveCameraView(view);
    if (view === "iso") {
      cameraRef.current.position.set(0, 7, 22);
    } else if (view === "front") {
      cameraRef.current.position.set(0, 2.5, 24);
    } else if (view === "top") {
      cameraRef.current.position.set(0, 26, 0.1);
    }
    cameraRef.current.lookAt(0, 1.8, 0);
  };

  return (
    <div className={`relative w-full rounded-xs border border-[#1c2638] bg-[#05080e] overflow-hidden ${className}`}>
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-44 sm:h-52 cursor-grab active:cursor-grabbing select-none" />

      {/* Floating Tactical Telemetry Overlay */}
      <div className="absolute top-2 left-2 pointer-events-none flex flex-wrap items-center gap-2 text-[9px] font-mono">
        <div className="bg-[#080d16]/90 border border-[#1c2638] px-2 py-1 rounded-xs flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <span className="text-slate-300 font-bold">3D VOLUMETRIC HYDROGRAPH</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-400">STAGE vs RADAR QPE</span>
        </div>

        {hoveredData && (
          <div className="bg-[#080d16]/95 border border-[#1c2638] px-2 py-1 rounded-xs flex items-center gap-2">
            <span className="text-slate-400">TIME:</span>
            <span className="text-white font-bold">{hoveredData.timeLabel}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">STAGE:</span>
            <span
              className={`font-bold ${
                hoveredData.stageM >= 2.8 ? "text-rose-400" : "text-sky-400"
              }`}
            >
              +{hoveredData.stageM.toFixed(2)}m
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">RAIN:</span>
            <span className="text-amber-400 font-bold">{hoveredData.qpeMm} mm/h</span>
          </div>
        )}
      </div>

      {/* Critical Breach Plane Badge (+2.80m MSL) */}
      <div className="absolute top-2 right-2 pointer-events-none flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/50 px-2 py-1 rounded-xs text-[9px] font-mono text-rose-300">
        <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
        <span>BREACH THRESHOLD +2.80m MSL</span>
      </div>

      {/* 3D View Controls Toolbar */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-[#080d16]/90 border border-[#1c2638] p-1 rounded-xs text-[9px] font-mono z-10">
        <button
          onClick={() => setCameraPreset("iso")}
          className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
            activeCameraView === "iso" ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Isometric View"
        >
          ISO
        </button>
        <button
          onClick={() => setCameraPreset("front")}
          className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
            activeCameraView === "front" ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Front Elevation"
        >
          FRONT
        </button>
        <button
          onClick={() => setCameraPreset("top")}
          className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
            activeCameraView === "top" ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Top Plan View"
        >
          TOP
        </button>
        <div className="w-px h-3 bg-slate-700 mx-0.5" />
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-1.5 py-0.5 rounded-xs flex items-center gap-1 transition-colors cursor-pointer ${
            autoRotate ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCw className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">{autoRotate ? "STOP" : "ORBIT"}</span>
        </button>
      </div>

      {/* 3D Legend Bar */}
      <div className="absolute bottom-2 left-2 pointer-events-none flex flex-wrap items-center gap-2 bg-[#080d16]/90 border border-[#1c2638] px-2 py-1 rounded-xs text-[8px] font-mono text-slate-300">
        <div className="flex items-center gap-1">
          <span className="w-2 h-0.5 bg-sky-400" />
          <span>Stage Ribbon</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-amber-500/60 border border-amber-400" />
          <span>QPE Pillars</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-0.5 bg-rose-500" />
          <span>Breach Plane</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-1 bg-sky-400/20 border border-sky-400/40" />
          <span>P10/P90 Canopy</span>
        </div>
      </div>
    </div>
  );
};
