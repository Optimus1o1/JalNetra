"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, ZoomIn, ZoomOut, Compass, Info } from "lucide-react";

interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: "enso" | "iod" | "bob" | "kolkata";
  value: string;
  desc: string;
  color: number;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "kolkata",
    name: "Kolkata Metropolitan Delta (HQ)",
    lat: 22.57,
    lon: 88.36,
    type: "kolkata",
    value: "Target Digital Twin",
    desc: "Estuarine urban confluence at risk from compound tidal surges and convective cloudbursts.",
    color: 0x06b6d4, // Cyan
  },
  {
    id: "bob",
    name: "Bay of Bengal SST Anomaly",
    lat: 16.0,
    lon: 89.0,
    type: "bob",
    value: "+1.18°C Anomaly",
    desc: "Elevated thermal heat content accelerating monsoonal cyclogenesis and heavy vapor flux.",
    color: 0xf59e0b, // Amber
  },
  {
    id: "enso",
    name: "Equatorial Pacific Niño 3.4",
    lat: 0.0,
    lon: -140.0,
    type: "enso",
    value: "+1.42°C El Niño",
    desc: "Weakened Walker Circulation suppressing standard monsoon onset while inducing localized extreme surges.",
    color: 0xa855f7, // Purple
  },
  {
    id: "iod_west",
    name: "Western Indian Ocean (+IOD)",
    lat: -5.0,
    lon: 55.0,
    type: "iod",
    value: "+0.64°C Gradient",
    desc: "Warm pole fueling Arabian Sea atmospheric moisture transport toward eastern basins.",
    color: 0x10b981, // Emerald
  },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const GlobalClimateGlobe3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(HOTSPOTS[0]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setAutoRotate(false);
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 220;
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 60;

    // 3a. Deep Base Sphere
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x050c18,
      transparent: true,
      opacity: 0.95,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);

    // 3b. Coordinate Wireframe Lines (Latitude & Longitude Rings)
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.15,
    });

    // Latitudes
    for (let lat = -60; lat <= 60; lat += 30) {
      const ringRadius = GLOBE_RADIUS * Math.cos((lat * Math.PI) / 180);
      const ringY = GLOBE_RADIUS * Math.sin((lat * Math.PI) / 180);
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
        points.push(new THREE.Vector3(Math.cos(theta) * ringRadius, ringY, Math.sin(theta) * ringRadius));
      }
      ringGeo.setFromPoints(points);
      const ring = new THREE.Line(ringGeo, wireframeMat);
      globeGroup.add(ring);
    }

    // Longitudes
    for (let lon = 0; lon < 180; lon += 30) {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
        const x = GLOBE_RADIUS * Math.cos(theta) * Math.sin((lon * Math.PI) / 180);
        const y = GLOBE_RADIUS * Math.sin(theta);
        const z = GLOBE_RADIUS * Math.cos(theta) * Math.cos((lon * Math.PI) / 180);
        points.push(new THREE.Vector3(x, y, z));
      }
      ringGeo.setFromPoints(points);
      const ring = new THREE.Line(ringGeo, wireframeMat);
      globeGroup.add(ring);
    }

    // 3c. Atmospheric Glow Outer Shell
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphereMesh);

    // 3d. Equator Wave Orbit (Simulating MJO Wave Envelope)
    const mjoGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.05, GLOBE_RADIUS * 1.07, 64);
    const mjoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const mjoRing = new THREE.Mesh(mjoGeo, mjoMat);
    mjoRing.rotation.x = Math.PI / 2;
    globeGroup.add(mjoRing);

    // 3e. Hotspots & Data Beacons
    const beaconMeshes: { mesh: THREE.Mesh; ring: THREE.Mesh; hotspot: Hotspot }[] = [];

    HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, GLOBE_RADIUS);

      // Core point
      const pointGeo = new THREE.SphereGeometry(spot.id === "kolkata" ? 2.2 : 1.6, 16, 16);
      const pointMat = new THREE.MeshBasicMaterial({ color: spot.color });
      const pointMesh = new THREE.Mesh(pointGeo, pointMat);
      pointMesh.position.copy(pos);
      globeGroup.add(pointMesh);

      // Pulsing halo ring
      const haloGeo = new THREE.RingGeometry(2.0, 3.8, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: spot.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(pos);
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(haloMesh);

      beaconMeshes.push({ mesh: pointMesh, ring: haloMesh, hotspot: spot });

      // Arc connecting Bay of Bengal to Kolkata
      if (spot.id === "bob") {
        const kolkataPos = latLonToVector3(22.57, 88.36, GLOBE_RADIUS);
        const midPoint = new THREE.Vector3()
          .addVectors(pos, kolkataPos)
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(GLOBE_RADIUS * 1.15);

        const curve = new THREE.QuadraticBezierCurve3(pos, midPoint, kolkataPos);
        const curvePoints = curve.getPoints(24);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const curveMat = new THREE.LineBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.8,
        });
        const curveLine = new THREE.Line(curveGeo, curveMat);
        globeGroup.add(curveLine);
      }
    });

    // Default rotation so Kolkata and Indian Ocean face camera
    globeGroup.rotation.y = -Math.PI * 0.45;
    globeGroup.rotation.x = 0.25;

    // 4. Mouse / Touch Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !globeGroupRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      globeGroupRef.current.rotation.y += deltaX * 0.006;
      globeGroupRef.current.rotation.x += deltaY * 0.006;

      prevMouseX = clientX;
      prevMouseY = clientY;
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
    let clock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clock += 0.02;

      // Auto-rotate if not dragging
      if (autoRotate && !isDragging && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.0025;
      }

      // Animate pulsing beacon rings
      beaconMeshes.forEach(({ ring }, idx) => {
        const scale = 1 + Math.sin(clock * 2.5 + idx) * 0.3;
        ring.scale.set(scale, scale, scale);
      });

      // Animate MJO wave ripple
      mjoRing.rotation.z = clock * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
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
      sphereGeo.dispose();
      sphereMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
    };
  }, [autoRotate]);

  const handleZoom = (direction: "in" | "out") => {
    if (!cameraRef.current) return;
    const newZ = direction === "in" ? Math.max(120, cameraRef.current.position.z - 25) : Math.min(320, cameraRef.current.position.z + 25);
    cameraRef.current.position.z = newZ;
    setZoomLevel(Number((220 / newZ).toFixed(2)));
  };

  const resetView = () => {
    if (!globeGroupRef.current || !cameraRef.current) return;
    globeGroupRef.current.rotation.y = -Math.PI * 0.45;
    globeGroupRef.current.rotation.x = 0.25;
    cameraRef.current.position.z = 220;
    setZoomLevel(1);
    setActiveHotspot(HOTSPOTS[0]);
  };

  const focusHotspot = (spot: Hotspot) => {
    setActiveHotspot(spot);
    if (!globeGroupRef.current) return;
    // Rotate to face hotspot longitude
    const targetRotY = -(spot.lon + 90) * (Math.PI / 180);
    const targetRotX = (spot.lat * Math.PI) / 360;
    globeGroupRef.current.rotation.y = targetRotY;
    globeGroupRef.current.rotation.x = targetRotX;
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top HUD Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-slate-900/60 z-10 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            3D Global Earth Twin // Convective SST Teleconnections
          </span>
        </div>

        {/* Viewport Control Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Earth Auto-Rotation"
            className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
              autoRotate
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{autoRotate ? "Orbiting" : "Paused"}</span>
          </button>

          <button
            onClick={() => handleZoom("in")}
            title="Zoom In"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom("out")}
            title="Zoom Out"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetView}
            title="Reset to Kolkata Delta View"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[360px] sm:h-[440px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Interactive Teleconnection Selector Pills */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              onClick={() => focusHotspot(spot)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeHotspot.id === spot.id
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20 font-bold"
                  : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `#${spot.color.toString(16).padStart(6, "0")}` }}
              />
              {spot.name.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Zoom: <span className="text-cyan-400">{zoomLevel}x</span> | Drag to rotate 360°
        </div>
      </div>

      {/* Hotspot Detailed Telemetry Drawer */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 font-sans">
                {activeHotspot.name}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                style={{
                  backgroundColor: `#${activeHotspot.color.toString(16).padStart(6, "0")}22`,
                  color: `#${activeHotspot.color.toString(16).padStart(6, "0")}`,
                }}
              >
                {activeHotspot.value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {activeHotspot.desc}
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500 shrink-0">
          LAT: {activeHotspot.lat}° | LON: {activeHotspot.lon}°
        </div>
      </div>
    </div>
  );
};
