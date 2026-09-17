"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  Info,
  Clock,
  Sun,
  Cloud,
  Waves,
  Eye,
  Activity,
  Layers,
} from "lucide-react";

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

// Convert lon/lat to equirectangular canvas X/Y
function geoToCanvas(lon: number, lat: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y];
}

/* ========================================================= */
/* 1. Procedural Day Earth Canvas Texture                     */
/* ========================================================= */
function generateDayEarthTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Ocean base gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, "#081b33");
  oceanGrad.addColorStop(0.35, "#0b2b4f");
  oceanGrad.addColorStop(0.5, "#09335e"); // Tropical deep azure
  oceanGrad.addColorStop(0.65, "#0b2b4f");
  oceanGrad.addColorStop(1, "#081b33");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Continental shelf shallow glow
  ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
  ctx.filter = "blur(6px)";

  // Helper to draw continent polygons
  const drawLandmass = (
    coords: [number, number][],
    fillColor: string,
    shelfColor = "rgba(6, 182, 212, 0.18)"
  ) => {
    // 1. Shelf halo
    ctx.filter = "blur(4px)";
    ctx.fillStyle = shelfColor;
    ctx.beginPath();
    coords.forEach(([lon, lat], i) => {
      const [x, y] = geoToCanvas(lon, lat, w, h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // 2. Solid Landmass
    ctx.filter = "none";
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    coords.forEach(([lon, lat], i) => {
      const [x, y] = geoToCanvas(lon, lat, w, h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  };

  // Indian Subcontinent & Himalayas (Target Focus)
  drawLandmass(
    [
      [68, 24], [70, 28], [72, 33], [75, 36], [78, 35], [82, 30],
      [88, 28], [94, 28], [96, 25], [92, 21], [88, 22.5], [86, 20],
      [82, 16], [80, 12], [77, 8.5], [76, 10], [74, 15], [72, 19],
      [68, 22],
    ],
    "#1e3a29" // Rich vegetation green
  );

  // Eurasian Landmass
  drawLandmass(
    [
      [-10, 36], [-5, 43], [5, 48], [12, 54], [25, 60], [45, 66],
      [65, 70], [90, 72], [120, 72], [145, 65], [170, 65], [140, 50],
      [130, 42], [122, 32], [115, 22], [105, 10], [100, 15], [95, 22],
      [90, 25], [75, 35], [60, 38], [50, 30], [35, 32], [28, 41],
      [15, 38], [0, 38], [-10, 36],
    ],
    "#1a3325"
  );

  // Africa
  drawLandmass(
    [
      [-17, 15], [-12, 28], [0, 35], [12, 37], [32, 31], [42, 12],
      [51, 10], [40, -5], [35, -20], [28, -32], [18, -34], [12, -20],
      [8, 5], [-5, 5], [-17, 15],
    ],
    "#2d3a22" // Savanna / Arid
  );

  // Australia
  drawLandmass(
    [
      [114, -22], [122, -18], [135, -12], [142, -11], [150, -22],
      [153, -28], [148, -38], [138, -35], [128, -32], [115, -34],
      [114, -22],
    ],
    "#3d331e" // Arid ochre
  );

  // North America
  drawLandmass(
    [
      [-165, 65], [-140, 69], [-120, 70], [-90, 70], [-60, 60],
      [-65, 45], [-75, 35], [-80, 25], [-95, 20], [-105, 20],
      [-115, 30], [-124, 40], [-130, 50], [-160, 58], [-165, 65],
    ],
    "#1d3326"
  );

  // South America
  drawLandmass(
    [
      [-78, 10], [-60, 10], [-48, -2], [-35, -5], [-38, -18],
      [-48, -28], [-55, -38], [-68, -54], [-75, -45], [-72, -28],
      [-80, -5], [-78, 10],
    ],
    "#183d28" // Amazonian green
  );

  // Antarctica
  drawLandmass(
    [
      [-180, -72], [-120, -74], [-60, -68], [0, -70], [60, -68],
      [120, -70], [180, -72], [180, -90], [-180, -90],
    ],
    "#a5c4d4" // Glacial ice shelf
  );

  // Himalayan Snowline Highlights
  ctx.fillStyle = "rgba(230, 245, 255, 0.75)";
  ctx.beginPath();
  const himalayas: [number, number][] = [
    [74, 34], [78, 32], [82, 29], [86, 28], [90, 28], [88, 27], [80, 30], [74, 34],
  ];
  himalayas.forEach(([lon, lat], i) => {
    const [x, y] = geoToCanvas(lon, lat, w, h);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/* ========================================================= */
/* 2. Procedural Night Earth City Lights Texture              */
/* ========================================================= */
function generateNightEarthTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Pure deep night base
  ctx.fillStyle = "#010308";
  ctx.fillRect(0, 0, w, h);

  // Helper to draw illuminated city clusters
  const drawCityGlow = (lon: number, lat: number, radius: number, intensity: number) => {
    const [x, y] = geoToCanvas(lon, lat, w, h);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(255, 220, 130, ${intensity})`);
    grad.addColorStop(0.35, `rgba(245, 158, 11, ${intensity * 0.7})`);
    grad.addColorStop(0.8, `rgba(217, 119, 6, ${intensity * 0.25})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Primary Metropolitan Light Nodes
  // Gangetic Delta & Kolkata Core (High-Density Corridor)
  drawCityGlow(88.36, 22.57, 14, 0.95); // Kolkata
  drawCityGlow(90.41, 23.81, 12, 0.9); // Dhaka
  drawCityGlow(85.13, 25.61, 8, 0.75); // Patna
  drawCityGlow(83.0, 25.3, 7, 0.75); // Varanasi
  drawCityGlow(80.94, 26.85, 9, 0.8); // Lucknow
  drawCityGlow(77.2, 28.61, 15, 0.95); // Delhi-NCR
  drawCityGlow(72.87, 19.07, 14, 0.95); // Mumbai
  drawCityGlow(77.59, 12.97, 12, 0.85); // Bengaluru
  drawCityGlow(80.27, 13.08, 11, 0.85); // Chennai
  drawCityGlow(78.48, 17.38, 10, 0.85); // Hyderabad

  // Southeast & East Asia
  drawCityGlow(100.5, 13.75, 12, 0.9); // Bangkok
  drawCityGlow(103.8, 1.35, 11, 0.95); // Singapore
  drawCityGlow(106.8, -6.2, 12, 0.9); // Jakarta
  drawCityGlow(121.47, 31.23, 16, 0.95); // Shanghai
  drawCityGlow(116.4, 39.9, 15, 0.9); // Beijing
  drawCityGlow(113.26, 23.13, 15, 0.95); // Guangzhou
  drawCityGlow(126.97, 37.56, 14, 0.95); // Seoul
  drawCityGlow(139.69, 35.68, 18, 1.0); // Tokyo

  // Europe & Middle East
  drawCityGlow(55.27, 25.2, 10, 0.9); // Dubai
  drawCityGlow(31.23, 30.04, 11, 0.85); // Cairo
  drawCityGlow(37.61, 55.75, 13, 0.85); // Moscow
  drawCityGlow(2.35, 48.85, 14, 0.9); // Paris
  drawCityGlow(-0.12, 51.5, 14, 0.95); // London
  drawCityGlow(13.4, 52.52, 11, 0.85); // Berlin

  // Americas
  drawCityGlow(-74.0, 40.71, 16, 0.95); // New York
  drawCityGlow(-87.62, 41.87, 13, 0.85); // Chicago
  drawCityGlow(-118.24, 34.05, 15, 0.9); // Los Angeles
  drawCityGlow(-46.63, -23.55, 14, 0.9); // São Paulo
  drawCityGlow(-58.38, -34.6, 12, 0.85); // Buenos Aires

  // Background urban sprawl ribbon along coastlines
  ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
  for (let i = 0; i < 200; i++) {
    const lon = (Math.random() - 0.5) * 360;
    const lat = (Math.random() - 0.5) * 120;
    const [x, y] = geoToCanvas(lon, lat, w, h);
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/* ========================================================= */
/* 3. Procedural Atmospheric Cloud Cover Texture             */
/* ========================================================= */
function generateCloudTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, w, h);

  // Tropical ITCZ Convective Belt (Equatorial band)
  ctx.fillStyle = "rgba(240, 249, 255, 0.38)";
  ctx.filter = "blur(8px)";

  // Draw monsoonal cloud swirls
  const drawCloudSwirl = (lon: number, lat: number, rx: number, ry: number, alpha: number) => {
    const [cx, cy] = geoToCanvas(lon, lat, w, h);
    ctx.fillStyle = `rgba(248, 250, 252, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  };

  // Indian Monsoon Cyclonic Vortex over Bay of Bengal
  drawCloudSwirl(88, 18, 48, 28, 0.55);
  drawCloudSwirl(84, 22, 54, 32, 0.6); // Covers Kolkata delta
  drawCloudSwirl(76, 14, 40, 24, 0.45); // Arabian Sea arm
  drawCloudSwirl(65, 8, 50, 22, 0.4);

  // Equatorial Pacific ITCZ bands
  for (let lon = -170; lon <= 170; lon += 35) {
    drawCloudSwirl(lon, 4 + Math.sin(lon * 0.1) * 6, 65, 16, 0.35);
  }

  // Mid-latitude spiral storm systems
  drawCloudSwirl(-40, 48, 70, 30, 0.4); // North Atlantic
  drawCloudSwirl(160, 45, 80, 35, 0.42); // North Pacific
  drawCloudSwirl(40, -50, 90, 25, 0.45); // Southern Ocean

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export const GlobalClimateGlobe3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(HOTSPOTS[0]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Simulation Controls & Telemetry State
  const [simSpeed, setSimSpeed] = useState<"1x" | "60x" | "1440x">("1x");
  const [layers, setLayers] = useState({
    clouds: true,
    terminator: true,
    sstAnomalies: true,
    vaporStream: true,
    beacons: true,
  });

  const [simTelemetry, setSimTelemetry] = useState<{
    utcTime: string;
    subsolarLon: string;
    subsolarLat: string;
    kolkataSolarAngle: string;
    isKolkataDay: boolean;
  }>({
    utcTime: "12:00:00 UTC",
    subsolarLon: "0.0°",
    subsolarLat: "+12.4°",
    kolkataSolarAngle: "78° Solar Noon",
    isKolkataDay: true,
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const earthShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // Simulation time accumulator
  const simTimeOffsetRef = useRef<number>(0);

  const toggleLayer = (k: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setAutoRotate(false);
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020409);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;
    cameraRef.current = camera;

    // 2. High-Performance Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Globe Master Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 60;

    // 4. Procedural Earth Textures
    const dayTexture = generateDayEarthTexture();
    const nightTexture = generateNightEarthTexture();
    const cloudTexture = generateCloudTexture();

    // 5. Day/Night Astronomical Terminator Shader
    const earthCustomShader = {
      uniforms: {
        dayMap: { value: dayTexture },
        nightMap: { value: nightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        useTerminator: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D dayMap;
        uniform sampler2D nightMap;
        uniform vec3 sunDirection;
        uniform float useTerminator;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 n = normalize(vNormal);
          vec3 s = normalize(sunDirection);
          float sunDot = dot(n, s);

          // Smooth twilight transition width
          float dayFactor = smoothstep(-0.2, 0.2, sunDot);

          vec4 dayColor = texture2D(dayMap, vUv);
          vec4 nightColor = texture2D(nightMap, vUv);

          // Subtle atmospheric rim fresnel
          vec3 viewDir = normalize(-vWorldPosition);
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, n)), 3.0) * 0.35;
          vec3 atmosGlow = vec3(0.02, 0.72, 0.95) * fresnel;

          if (useTerminator > 0.5) {
            vec3 blended = mix(nightColor.rgb * 1.6, dayColor.rgb, dayFactor);
            gl_FragColor = vec4(blended + (dayFactor * atmosGlow), 1.0);
          } else {
            gl_FragColor = vec4(dayColor.rgb + atmosGlow, 1.0);
          }
        }
      `,
    };

    const earthShaderMat = new THREE.ShaderMaterial({
      uniforms: earthCustomShader.uniforms,
      vertexShader: earthCustomShader.vertexShader,
      fragmentShader: earthCustomShader.fragmentShader,
    });
    earthShaderMatRef.current = earthShaderMat;

    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMesh = new THREE.Mesh(sphereGeo, earthShaderMat);
    globeGroup.add(earthMesh);

    // 6. Atmospheric Cloud Layer (Concentric outer shell)
    const cloudsGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    // 7. Outer Atmospheric Glowing Corona
    const coronaGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    globeGroup.add(coronaMesh);

    // 8. 3D Animated Monsoonal Moisture Jet Stream (Somali Jet -> Bay of Bengal -> Kolkata)
    const moistureSpline = new THREE.CatmullRomCurve3([
      latLonToVector3(-15, 60, GLOBE_RADIUS * 1.03), // Southern Ocean
      latLonToVector3(-2, 52, GLOBE_RADIUS * 1.035), // Equatorial Somali Jet
      latLonToVector3(8, 62, GLOBE_RADIUS * 1.04), // Arabian Sea Cross-Equatorial Surge
      latLonToVector3(14, 75, GLOBE_RADIUS * 1.04), // Southern India Gateway
      latLonToVector3(17, 88, GLOBE_RADIUS * 1.035), // Bay of Bengal Moisture Pool
      latLonToVector3(22.57, 88.36, GLOBE_RADIUS * 1.025), // Kolkata Confluence Delta
    ]);

    const moisturePoints = moistureSpline.getPoints(80);
    const moistureLineGeo = new THREE.BufferGeometry().setFromPoints(moisturePoints);
    const moistureLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    const moistureTube = new THREE.Line(moistureLineGeo, moistureLineMat);
    globeGroup.add(moistureTube);

    // Flowing particles along the monsoonal tube
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleOffsets: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const offset = i / particleCount;
      particleOffsets.push(offset);
      const pt = moistureSpline.getPoint(offset);
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 3.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const moistureParticles = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(moistureParticles);

    // 9. Sea Surface Temperature (SST) Thermal Anomaly Convective Plumes
    const sstGroup = new THREE.Group();
    const sstPlumes = [
      { lat: 0.0, lon: -140.0, color: 0xa855f7, r: 8, label: "Niño 3.4" }, // Pacific
      { lat: 16.0, lon: 89.0, color: 0xf59e0b, r: 7, label: "Bay of Bengal" }, // BoB
      { lat: -5.0, lon: 55.0, color: 0x10b981, r: 6, label: "IOD West" }, // IOD
    ];

    const sstMeshes: THREE.Mesh[] = [];
    sstPlumes.forEach((plume) => {
      const pos = latLonToVector3(plume.lat, plume.lon, GLOBE_RADIUS * 1.01);
      const ringGeo = new THREE.RingGeometry(1, plume.r, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: plume.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      sstGroup.add(ringMesh);
      sstMeshes.push(ringMesh);
    });
    globeGroup.add(sstGroup);

    // 10. Telemetry Hotspots & Beacons
    const beaconMeshes: { mesh: THREE.Mesh; ring: THREE.Mesh; hotspot: Hotspot }[] = [];
    const beaconsGroup = new THREE.Group();

    HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, GLOBE_RADIUS * 1.02);

      const pointGeo = new THREE.SphereGeometry(spot.id === "kolkata" ? 2.4 : 1.8, 16, 16);
      const pointMat = new THREE.MeshBasicMaterial({ color: spot.color });
      const pointMesh = new THREE.Mesh(pointGeo, pointMat);
      pointMesh.position.copy(pos);
      beaconsGroup.add(pointMesh);

      const haloGeo = new THREE.RingGeometry(2.0, 4.2, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: spot.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(pos);
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0));
      beaconsGroup.add(haloMesh);

      beaconMeshes.push({ mesh: pointMesh, ring: haloMesh, hotspot: spot });
    });
    globeGroup.add(beaconsGroup);

    // Initial rotation: Orient India and Indian Ocean toward camera
    globeGroup.rotation.y = -Math.PI * 0.45;
    globeGroup.rotation.x = 0.22;

    // 11. Mouse & Touch Drag Controls
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

    // 12. Main Real-Time Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update simulation time offset depending on speed
      const speedMultiplier = simSpeed === "1440x" ? 1440 : simSpeed === "60x" ? 60 : 1;
      simTimeOffsetRef.current += delta * speedMultiplier;

      // Real-time astronomical subsolar calculation
      const now = new Date(Date.now() + simTimeOffsetRef.current * 1000);
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

      // Subsolar Longitude: At 12:00 UTC, Sun is at 0° lon
      const subsolarLonDeg = -(utcHours - 12) * 15;
      // Solar Declination for September (approx zero/equinoctial, slight north +2°)
      const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000
      );
      const subsolarLatDeg = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));

      const sunVec = latLonToVector3(subsolarLatDeg, subsolarLonDeg, 1.0).normalize();

      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.sunDirection.value.copy(sunVec);
        earthShaderMatRef.current.uniforms.useTerminator.value = layers.terminator ? 1.0 : 0.0;
      }

      // Atmospheric Cloud Drift (Independent rotation)
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.visible = layers.clouds;
        cloudsMeshRef.current.rotation.y += delta * 0.02;
      }

      // Monsoonal Stream Particle Movement
      if (layers.vaporStream) {
        moistureTube.visible = true;
        moistureParticles.visible = true;
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          particleOffsets[i] = (particleOffsets[i] + delta * 0.15) % 1.0;
          const pt = moistureSpline.getPoint(particleOffsets[i]);
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;
      } else {
        moistureTube.visible = false;
        moistureParticles.visible = false;
      }

      // SST Anomaly Plume Pulsing
      sstGroup.visible = layers.sstAnomalies;
      if (layers.sstAnomalies) {
        sstMeshes.forEach((mesh, idx) => {
          const s = 1.0 + Math.sin(elapsed * 2.5 + idx * 1.5) * 0.2;
          mesh.scale.set(s, s, s);
        });
      }

      // Hotspot Beacons Pulsing
      beaconsGroup.visible = layers.beacons;
      if (layers.beacons) {
        beaconMeshes.forEach(({ ring }, idx) => {
          const s = 1.0 + Math.sin(elapsed * 3.0 + idx) * 0.25;
          ring.scale.set(s, s, 1);
        });
      }

      // Auto-rotation around Earth axis
      if (autoRotate && !isDragging && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.0018;
      }

      renderer.render(scene, camera);

      // Periodically update telemetry HUD state (every ~30 frames)
      if (Math.floor(elapsed * 10) % 6 === 0) {
        // Angle between Sun vector and Kolkata position (22.57°N, 88.36°E)
        const kolkataVec = latLonToVector3(22.57, 88.36, 1.0).normalize();
        const kolkataSunDot = kolkataVec.dot(sunVec);
        const solarZenithDeg = (Math.acos(Math.max(-1, Math.min(1, kolkataSunDot))) * 180) / Math.PI;

        setSimTelemetry({
          utcTime: now.toISOString().slice(11, 19) + " UTC",
          subsolarLon: `${subsolarLonDeg.toFixed(1)}°`,
          subsolarLat: `${subsolarLatDeg >= 0 ? "+" : ""}${subsolarLatDeg.toFixed(1)}°`,
          kolkataSolarAngle: `${solarZenithDeg.toFixed(0)}° ${kolkataSunDot > 0 ? "Zenith" : "Nadir"}`,
          isKolkataDay: kolkataSunDot > -0.1,
        });
      }
    };

    animate();

    // 13. Responsive ResizeObserver
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

    // 14. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      domElement.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      domElement.removeEventListener("touchend", handlePointerUp);
      resizeObserver.disconnect();

      renderer.dispose();
      sphereGeo.dispose();
      earthShaderMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      moistureLineGeo.dispose();
      moistureLineMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      cloudTexture.dispose();
    };
  }, [autoRotate, simSpeed, layers.clouds, layers.terminator, layers.sstAnomalies, layers.vaporStream, layers.beacons]);

  const handleZoom = (direction: "in" | "out") => {
    if (!cameraRef.current) return;
    const newZ =
      direction === "in"
        ? Math.max(110, cameraRef.current.position.z - 25)
        : Math.min(310, cameraRef.current.position.z + 25);
    cameraRef.current.position.z = newZ;
    setZoomLevel(Number((210 / newZ).toFixed(2)));
  };

  const resetView = () => {
    if (!globeGroupRef.current || !cameraRef.current) return;
    globeGroupRef.current.rotation.y = -Math.PI * 0.45;
    globeGroupRef.current.rotation.x = 0.22;
    cameraRef.current.position.z = 210;
    setZoomLevel(1);
    setActiveHotspot(HOTSPOTS[0]);
  };

  const focusHotspot = (spot: Hotspot) => {
    setActiveHotspot(spot);
    if (!globeGroupRef.current) return;
    const targetRotY = -(spot.lon + 90) * (Math.PI / 180);
    const targetRotX = (spot.lat * Math.PI) / 360;
    globeGroupRef.current.rotation.y = targetRotY;
    globeGroupRef.current.rotation.x = targetRotX;
  };

  return (
    <div className="relative w-full rounded-xl bg-[#030712] border border-cyan-500/25 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Operations Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-800/80 bg-slate-950/80 gap-2 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-cyan-300 tracking-wider uppercase">
            EARTH DIGITAL TWIN // REAL-TIME ASTRONOMICAL CLIMATE SIMULATION
          </span>
          <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/50 text-[10px] text-cyan-400">
            SOLAR TERMINATOR + MONSOON VAPOR JETS
          </span>
        </div>

        {/* Live Simulation Speed Selector & Camera Controls */}
        <div className="flex items-center gap-1.5">
          {/* Time Warp Speed Selector */}
          <div className="flex items-center bg-[#050811] border border-[#1c2638] p-0.5 rounded text-[10px]">
            {(["1x", "60x", "1440x"] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${
                  simSpeed === speed
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={speed === "1x" ? "Real-Time 1:1" : `${speed} Accelerated Diurnal Cycle`}
              >
                {speed === "1x" ? "1x (LIVE)" : speed}
              </button>
            ))}
          </div>

          <div className="w-px h-3.5 bg-slate-800 mx-0.5" />

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Planetary Orbit"
            className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
              autoRotate
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{autoRotate ? "Orbit" : "Pause"}</span>
          </button>

          <button
            onClick={() => handleZoom("in")}
            title="Zoom In"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom("out")}
            title="Zoom Out"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetView}
            title="Reset to Kolkata Delta Center"
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Astronomical Telemetry Strip */}
      <div className="px-3.5 py-1.5 bg-[#050a14] border-b border-slate-800/70 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">UTC CLOCK:</span>
            <span className="text-white font-bold">{simTelemetry.utcTime}</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Sun className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">SUBSOLAR:</span>
            <span className="text-amber-300">
              {simTelemetry.subsolarLat}, {simTelemetry.subsolarLon}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">KOLKATA SUN:</span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                simTelemetry.isKolkataDay
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                  : "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40"
              }`}
            >
              {simTelemetry.isKolkataDay ? "DAYLIGHT" : "NIGHT (GRID ILLUMINATED)"}
            </span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="text-slate-400">
            SOLAR ZENITH: <span className="text-sky-300">{simTelemetry.kolkataSolarAngle}</span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[380px] sm:h-[460px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Live Simulation Layer Filters */}
      <div className="p-2.5 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="text-slate-400 mr-1 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            LAYERS:
          </span>
          <button
            onClick={() => toggleLayer("terminator")}
            className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
              layers.terminator
                ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            DAY/NIGHT TERMINATOR
          </button>
          <button
            onClick={() => toggleLayer("clouds")}
            className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
              layers.clouds
                ? "bg-sky-950/40 text-sky-300 border-sky-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            ATMOSPHERIC CLOUDS
          </button>
          <button
            onClick={() => toggleLayer("vaporStream")}
            className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
              layers.vaporStream
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            MONSOON VAPOR JETS
          </button>
          <button
            onClick={() => toggleLayer("sstAnomalies")}
            className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
              layers.sstAnomalies
                ? "bg-amber-950/40 text-amber-300 border-amber-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            SST THERMAL PLUMES
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400">
          Zoom: <span className="text-cyan-400 font-bold">{zoomLevel}x</span> | 360° Drag & Track
        </div>
      </div>

      {/* Interactive Teleconnection Hotspot Pills */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              onClick={() => focusHotspot(spot)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
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

        <div className="text-[10px] font-mono text-slate-400">
          Target: <span className="text-cyan-300 font-bold">{activeHotspot.name.split(":")[0]}</span>
        </div>
      </div>

      {/* Selected Hotspot Detailed Telemetry Drawer */}
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
