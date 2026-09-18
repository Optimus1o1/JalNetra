"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  Info,
  Clock,
  Sun,
  Layers,
  Sparkles,
  Satellite,
  Wind,
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
    color: 0x06b6d4, // Electric Cyan
  },
  {
    id: "bob",
    name: "Bay of Bengal SST Anomaly",
    lat: 16.0,
    lon: 89.0,
    type: "bob",
    value: "+1.18°C Anomaly",
    desc: "Elevated thermal heat content accelerating monsoonal cyclogenesis and heavy vapor flux.",
    color: 0xf59e0b, // Photon Amber
  },
  {
    id: "enso",
    name: "Equatorial Pacific Niño 3.4",
    lat: 0.0,
    lon: -140.0,
    type: "enso",
    value: "+1.42°C El Niño",
    desc: "Weakened Walker Circulation suppressing standard monsoon onset while inducing localized extreme surges.",
    color: 0x8b5cf6, // Quantum Purple
  },
  {
    id: "iod_west",
    name: "Western Indian Ocean (+IOD)",
    lat: -5.0,
    lon: 55.0,
    type: "iod",
    value: "+0.64°C Gradient",
    desc: "Warm pole fueling Arabian Sea atmospheric moisture transport toward eastern basins.",
    color: 0x10b981, // Hyper Emerald
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
/* Procedural Fallback Textures (Ensures zero black screen)   */
/* ========================================================= */
function generateFallbackDayTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#081d36");
  grad.addColorStop(0.5, "#0b2e59");
  grad.addColorStop(1, "#081d36");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#264e2e";
  // Eurasia / India
  ctx.fillRect(w * 0.65, h * 0.35, w * 0.12, h * 0.2);
  // Americas
  ctx.fillRect(w * 0.2, h * 0.25, w * 0.15, h * 0.35);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function generateFallbackNightTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#020409";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#fbbf24";
  const [kx, ky] = geoToCanvas(88.36, 22.57, w, h);
  ctx.fillRect(kx, ky, 3, 3);
  const [dx, dy] = geoToCanvas(77.2, 28.61, w, h);
  ctx.fillRect(dx, dy, 3, 3);
  const [mx, my] = geoToCanvas(72.87, 19.07, w, h);
  ctx.fillRect(mx, my, 3, 3);
  const [tx, ty] = geoToCanvas(139.69, 35.68, w, h);
  ctx.fillRect(tx, ty, 3, 3);
  const [nx, ny] = geoToCanvas(-74.0, 40.71, w, h);
  ctx.fillRect(nx, ny, 3, 3);

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
  const [satelliteSourceLoaded, setSatelliteSourceLoaded] = useState<boolean>(false);

  // Smooth camera zoom tracking refs
  const targetCameraZRef = useRef<number>(210);
  const lastReportedZoomRef = useRef<number>(1);

  // Simulation Controls & Telemetry State
  const [simSpeed, setSimSpeed] = useState<"1x" | "60x" | "1440x">("1x");
  const [layers, setLayers] = useState({
    clouds: true,
    cloudShadows: true,
    terminator: true,
    atmosphereGlow: true,
    specularGlint: true,
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
    cloudDriftStatus: string;
  }>({
    utcTime: "12:00:00 UTC",
    subsolarLon: "0.0°",
    subsolarLat: "+12.4°",
    kolkataSolarAngle: "78° Solar Noon",
    isKolkataDay: true,
    cloudDriftStatus: "Tropical Trade Wind & Jet Stream Advection Active",
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const cloudsShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const atmosphereShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);

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
    scene.background = new THREE.Color(0x02040a); // Deep cosmic void

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;
    cameraRef.current = camera;

    // 2. High-Performance WebGL Renderer
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

    // 3. Master Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 60;

    // 4. Texture Loader & Textures Initialization
    const textureLoader = new THREE.TextureLoader();

    const fallbackDay = generateFallbackDayTexture();
    const fallbackNight = generateFallbackNightTexture();

    // =========================================================================
    // SHADER 1: PHOTOREALISTIC EARTH SURFACE WITH REAL-TIME CLOUD SHADOWS
    // =========================================================================
    const earthCustomShader = {
      uniforms: {
        dayMap: { value: fallbackDay },
        nightMap: { value: fallbackNight },
        specularMap: { value: fallbackDay },
        cloudMap: { value: fallbackDay },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        uTime: { value: 0.0 },
        useTerminator: { value: 1.0 },
        useSpecular: { value: 1.0 },
        useCloudShadows: { value: 1.0 },
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
        uniform sampler2D specularMap;
        uniform sampler2D cloudMap;
        uniform vec3 sunDirection;
        uniform float uTime;
        uniform float useTerminator;
        uniform float useSpecular;
        uniform float useCloudShadows;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 n = normalize(vNormal);
          vec3 s = normalize(sunDirection);
          vec3 v = normalize(-vWorldPosition);

          float sunDot = dot(n, s);
          // Realistic day/night twilight transition
          float dayFactor = smoothstep(-0.06, 0.12, sunDot);

          // Authentic NASA Blue Marble true-color daytime satellite photography
          vec4 dayColor = texture2D(dayMap, vUv);
          // Authentic NASA Black Marble nocturnal city lights
          vec4 nightColor = texture2D(nightMap, vUv);
          // Ocean mask (water = 1.0, land = 0.0)
          float specMask = texture2D(specularMap, vUv).r;

          vec3 dayRgb = dayColor.rgb;

          // Deep rich marine depth for oceans
          if (specMask > 0.05) {
            dayRgb = mix(dayRgb, vec3(dayRgb.r * 0.72, dayRgb.g * 0.9, dayRgb.b * 1.25), 0.42);
          }

          // -----------------------------------------------------------------
          // REAL-TIME CLOUD SHADOW PROJECTION ONTO EARTH SURFACE
          // -----------------------------------------------------------------
          if (useCloudShadows > 0.5) {
            // Dual-wind advection matching the cloud shader
            vec2 cUv1 = vec2(
              vUv.x + uTime * 0.0016,
              vUv.y + sin(vUv.x * 6.28318 + uTime * 0.012) * 0.002
            );
            vec2 cUv2 = vec2(
              vUv.x - uTime * 0.0024,
              vUv.y + cos(vUv.x * 7.5398 - uTime * 0.018) * 0.003
            );

            // Shift shadow slightly away from the sun direction
            vec2 shadowOffset = -normalize(s.xy + vec2(0.001)) * 0.0045;
            float cShadow1 = texture2D(cloudMap, cUv1 + shadowOffset).r;
            float cShadow2 = texture2D(cloudMap, cUv2 + shadowOffset).r;
            float cloudShadow = max(cShadow1 * 0.8, cShadow2 * 0.7);

            // Cast soft realistic cloud shadow on daytime continents & oceans
            dayRgb *= (1.0 - cloudShadow * 0.48);
          }

          // Photorealistic oceanic sun glint (bright celestial reflection over water)
          vec3 r = reflect(-s, n);
          float spec = pow(max(0.0, dot(r, v)), 38.0) * specMask * useSpecular * 2.8;
          vec3 sunGlint = vec3(1.0, 0.98, 0.92) * spec * max(0.0, sunDot);

          // Authentic Black Marble nocturnal city lights
          vec3 nightLit = nightColor.rgb * 2.4;
          vec3 dayLit = dayRgb + sunGlint;

          if (useTerminator > 0.5) {
            vec3 blended = mix(nightLit, dayLit, dayFactor);
            gl_FragColor = vec4(blended, 1.0);
          } else {
            gl_FragColor = vec4(dayLit, 1.0);
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

    // =========================================================================
    // SHADER 2: DYNAMIC FLUID ATMOSPHERIC CLOUDS WITH CORIOLIS MOVEMENT
    // =========================================================================
    const cloudsCustomShader = {
      uniforms: {
        cloudMap: { value: fallbackDay },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        uTime: { value: 0.0 },
        cloudOpacity: { value: 0.88 },
        visible: { value: 1.0 },
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
        uniform sampler2D cloudMap;
        uniform vec3 sunDirection;
        uniform float uTime;
        uniform float cloudOpacity;
        uniform float visible;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          if (visible < 0.5) discard;

          vec3 n = normalize(vNormal);
          vec3 s = normalize(sunDirection);
          vec3 v = normalize(-vWorldPosition);

          // ---------------------------------------------------------------
          // DUAL-SPEED ATMOSPHERIC ADVECTION & SWIRLING CLOUD MOTION
          // ---------------------------------------------------------------
          // Flow 1: Tropical Easterly Trade Winds & Monsoonal Drift
          vec2 uv1 = vec2(
            vUv.x + uTime * 0.0016,
            vUv.y + sin(vUv.x * 6.28318 + uTime * 0.012) * 0.002
          );

          // Flow 2: Mid-Latitude Westerlies & Jet Stream Vortices
          vec2 uv2 = vec2(
            vUv.x - uTime * 0.0024,
            vUv.y + cos(vUv.x * 7.5398 - uTime * 0.018) * 0.003
          );

          float c1 = texture2D(cloudMap, uv1).r;
          float c2 = texture2D(cloudMap, uv2).r;

          // Blend multiple atmospheric wind regimes with fluid curl interference
          float cloudDensity = max(c1 * 0.88, c2 * 0.74) + (c1 * c2 * 0.32);

          // Soft volumetric density falloff
          float alpha = smoothstep(0.14, 0.78, cloudDensity) * cloudOpacity;
          if (alpha < 0.015) discard;

          // Solar Lighting & Rayleigh Twilight Scattering on Clouds
          float sunDot = dot(n, s);
          float dayFactor = smoothstep(-0.08, 0.16, sunDot);

          // Forward Mie scattering (silver lining when looking towards the sun rim)
          float forwardScatter = pow(max(0.0, dot(v, s)), 4.5) * 0.42;

          // Sunset / Sunrise warm golden twilight tint on the terminator
          float terminatorScatter = exp(-pow((sunDot - 0.02) / 0.12, 2.0));
          vec3 twilightTint = vec3(1.0, 0.64, 0.36) * terminatorScatter * 0.9;

          // Day-lit cloud tops
          vec3 dayCloudRgb = vec3(0.98, 0.99, 1.0) * (0.86 + forwardScatter) + twilightTint;

          // Night-side clouds (realistic dark charcoal, absorbing light)
          vec3 nightCloudRgb = vec3(0.02, 0.025, 0.04);

          vec3 finalCloudRgb = mix(nightCloudRgb, dayCloudRgb, dayFactor);

          gl_FragColor = vec4(finalCloudRgb, alpha);
        }
      `,
    };

    const cloudsShaderMat = new THREE.ShaderMaterial({
      uniforms: cloudsCustomShader.uniforms,
      vertexShader: cloudsCustomShader.vertexShader,
      fragmentShader: cloudsCustomShader.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    cloudsShaderMatRef.current = cloudsShaderMat;

    const cloudsGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.007, 64, 64);
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsShaderMat);
    globeGroup.add(cloudsMesh);

    // =========================================================================
    // SHADER 3: PHOTOREALISTIC RAYLEIGH ATMOSPHERIC HORIZON CORONA
    // =========================================================================
    const atmosphereShader = {
      uniforms: {
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        visible: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform float visible;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          if (visible < 0.5) discard;

          vec3 n = normalize(vNormal);
          vec3 s = normalize(sunDirection);
          vec3 v = normalize(-vWorldPosition);

          // Razor-thin limb Fresnel against deep space
          float fresnel = pow(1.0 - max(0.0, dot(v, n)), 3.8);
          float sunDot = dot(n, s);
          float dayFactor = smoothstep(-0.25, 0.35, sunDot);

          // Sunset twilight reddening along terminator
          float twilight = exp(-pow((sunDot + 0.05) / 0.22, 2.0));
          vec3 twilightColor = vec3(0.9, 0.4, 0.14) * twilight * 0.7;

          vec3 atmosBlue = vec3(0.18, 0.58, 1.0) * 1.5;
          vec3 finalAtmos = (atmosBlue + twilightColor) * fresnel * (dayFactor * 0.95 + 0.05);

          gl_FragColor = vec4(finalAtmos, fresnel * dayFactor * 0.85);
        }
      `,
    };

    const atmosphereShaderMat = new THREE.ShaderMaterial({
      uniforms: atmosphereShader.uniforms,
      vertexShader: atmosphereShader.vertexShader,
      fragmentShader: atmosphereShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    atmosphereShaderMatRef.current = atmosphereShaderMat;

    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 64, 64);
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereShaderMat);
    globeGroup.add(atmosphereMesh);

    // =========================================================================
    // ASYNCHRONOUS LOAD OF AUTHENTIC NASA SATELLITE TEXTURES
    // =========================================================================
    textureLoader.load(
      "/textures/earth_day.jpg",
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        earthShaderMat.uniforms.dayMap.value = tex;
        setSatelliteSourceLoaded(true);
      },
      undefined,
      (err) => {
        console.warn("Satellite day texture fallback active:", err);
      }
    );

    textureLoader.load(
      "/textures/earth_night.jpg",
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        earthShaderMat.uniforms.nightMap.value = tex;
      }
    );

    textureLoader.load(
      "/textures/earth_specular.jpg",
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        earthShaderMat.uniforms.specularMap.value = tex;
      }
    );

    textureLoader.load(
      "/textures/earth_clouds.jpg",
      (cloudTex) => {
        cloudTex.wrapS = THREE.RepeatWrapping;
        cloudTex.wrapT = THREE.ClampToEdgeWrapping;
        cloudsShaderMat.uniforms.cloudMap.value = cloudTex;
        earthShaderMat.uniforms.cloudMap.value = cloudTex;
      }
    );

    // 6. Monsoonal Moisture Jet Stream (Somali Jet -> Bay of Bengal -> Kolkata)
    const moistureSpline = new THREE.CatmullRomCurve3([
      latLonToVector3(-15, 60, GLOBE_RADIUS * 1.03),
      latLonToVector3(-2, 52, GLOBE_RADIUS * 1.035),
      latLonToVector3(8, 62, GLOBE_RADIUS * 1.04),
      latLonToVector3(14, 75, GLOBE_RADIUS * 1.04),
      latLonToVector3(17, 88, GLOBE_RADIUS * 1.035),
      latLonToVector3(22.57, 88.36, GLOBE_RADIUS * 1.025),
    ]);

    const moisturePoints = moistureSpline.getPoints(80);
    const moistureLineGeo = new THREE.BufferGeometry().setFromPoints(moisturePoints);
    const moistureLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
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
      size: 3.4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const moistureParticles = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(moistureParticles);

    // 7. Sea Surface Temperature (SST) Thermal Anomaly Convective Plumes
    const sstGroup = new THREE.Group();
    const sstPlumes = [
      { lat: 0.0, lon: -140.0, color: 0x8b5cf6, r: 8, label: "Niño 3.4" },
      { lat: 16.0, lon: 89.0, color: 0xf59e0b, r: 7, label: "Bay of Bengal" },
      { lat: -5.0, lon: 55.0, color: 0x10b981, r: 6, label: "IOD West" },
    ];

    const sstMeshes: THREE.Mesh[] = [];
    sstPlumes.forEach((plume) => {
      const pos = latLonToVector3(plume.lat, plume.lon, GLOBE_RADIUS * 1.01);
      const ringGeo = new THREE.RingGeometry(1, plume.r, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: plume.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      sstGroup.add(ringMesh);
      sstMeshes.push(ringMesh);
    });
    globeGroup.add(sstGroup);

    // 8. Telemetry Hotspots & Beacons
    const beaconMeshes: { mesh: THREE.Mesh; ring: THREE.Mesh; hotspot: Hotspot }[] = [];
    const beaconsGroup = new THREE.Group();

    HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, GLOBE_RADIUS * 1.02);

      const pointGeo = new THREE.SphereGeometry(spot.id === "kolkata" ? 2.5 : 1.8, 16, 16);
      const pointMat = new THREE.MeshBasicMaterial({ color: spot.color });
      const pointMesh = new THREE.Mesh(pointGeo, pointMat);
      pointMesh.position.copy(pos);
      beaconsGroup.add(pointMesh);

      const haloGeo = new THREE.RingGeometry(2.0, 4.4, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: spot.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(pos);
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0));
      beaconsGroup.add(haloMesh);

      beaconMeshes.push({ mesh: pointMesh, ring: haloMesh, hotspot: spot });
    });
    globeGroup.add(beaconsGroup);

    // Orient India & Bay of Bengal toward camera by default
    globeGroup.rotation.y = -Math.PI * 0.45;
    globeGroup.rotation.x = 0.22;

    // 9. Interactive Drag & Zoom Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    let initialPinchDistance: number | null = null;
    let startPinchCameraZ = 210;

    const getPinchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handlePointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!isDragging || !globeGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      globeGroupRef.current.rotation.y += deltaX * 0.006;
      globeGroupRef.current.rotation.x += deltaY * 0.006;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let delta = e.deltaY;
      if (e.ctrlKey) {
        delta = e.deltaY * 0.85;
      } else if (Math.abs(delta) > 50) {
        delta = Math.sign(delta) * 20;
      } else {
        delta = delta * 0.35;
      }

      targetCameraZRef.current = Math.max(76, Math.min(320, targetCameraZRef.current + delta));
      const currentZoom = Number((210 / targetCameraZRef.current).toFixed(2));
      setZoomLevel(currentZoom);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        initialPinchDistance = getPinchDistance(e.touches);
        startPinchCameraZ = targetCameraZRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging && globeGroupRef.current) {
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const deltaX = clientX - prevMouseX;
        const deltaY = clientY - prevMouseY;
        globeGroupRef.current.rotation.y += deltaX * 0.006;
        globeGroupRef.current.rotation.x += deltaY * 0.006;
        prevMouseX = clientX;
        prevMouseY = clientY;
      } else if (e.touches.length === 2 && initialPinchDistance !== null) {
        e.preventDefault();
        e.stopPropagation();
        const currentDistance = getPinchDistance(e.touches);
        if (currentDistance > 0) {
          const ratio = initialPinchDistance / currentDistance;
          targetCameraZRef.current = Math.max(76, Math.min(320, startPinchCameraZ * ratio));
          const currentZoom = Number((210 / targetCameraZRef.current).toFixed(2));
          setZoomLevel(currentZoom);
        }
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      initialPinchDistance = null;
    };

    const domElement = renderer.domElement;
    domElement.style.touchAction = "none";
    domElement.style.display = "block";
    domElement.style.width = "100%";
    domElement.style.height = "100%";

    container.addEventListener("mousedown", handlePointerDown);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    domElement.addEventListener("wheel", handleWheel, { passive: false });
    domElement.addEventListener("touchstart", handleTouchStart, { passive: false });

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    // 10. Main High-Precision Real-Time Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let elapsedSimSeconds = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const nowMs = performance.now();
      const delta = Math.min((nowMs - lastTime) / 1000, 0.1);
      lastTime = nowMs;
      elapsedSimSeconds += delta;

      // Smooth camera zoom interpolation
      if (cameraRef.current) {
        cameraRef.current.position.z += (targetCameraZRef.current - cameraRef.current.position.z) * 0.18;
        cameraRef.current.lookAt(0, 0, 0);

        const currentZoom = Number((210 / cameraRef.current.position.z).toFixed(2));
        if (Math.abs(currentZoom - lastReportedZoomRef.current) >= 0.05) {
          lastReportedZoomRef.current = currentZoom;
          setZoomLevel(currentZoom);
        }
      }

      // Simulation time progression
      const speedMultiplier = simSpeed === "1440x" ? 1440 : simSpeed === "60x" ? 60 : 1;
      simTimeOffsetRef.current += delta * speedMultiplier;

      // Real-time astronomical subsolar calculation
      const now = new Date(Date.now() + simTimeOffsetRef.current * 1000);
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

      const subsolarLonDeg = -(utcHours - 12) * 15;
      const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000
      );
      const subsolarLatDeg = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));

      const sunVec = latLonToVector3(subsolarLatDeg, subsolarLonDeg, 1.0).normalize();

      // Update Earth Shader Uniforms
      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.sunDirection.value.copy(sunVec);
        earthShaderMatRef.current.uniforms.uTime.value = elapsedSimSeconds;
        earthShaderMatRef.current.uniforms.useTerminator.value = layers.terminator ? 1.0 : 0.0;
        earthShaderMatRef.current.uniforms.useSpecular.value = layers.specularGlint ? 1.0 : 0.0;
        earthShaderMatRef.current.uniforms.useCloudShadows.value = layers.cloudShadows ? 1.0 : 0.0;
      }

      // Update Real-Time Fluid Cloud Shader
      if (cloudsShaderMatRef.current) {
        cloudsShaderMatRef.current.uniforms.sunDirection.value.copy(sunVec);
        cloudsShaderMatRef.current.uniforms.uTime.value = elapsedSimSeconds;
        cloudsShaderMatRef.current.uniforms.visible.value = layers.clouds ? 1.0 : 0.0;
      }

      // Update Atmospheric Rayleigh Halo
      if (atmosphereShaderMatRef.current) {
        atmosphereShaderMatRef.current.uniforms.sunDirection.value.copy(sunVec);
        atmosphereShaderMatRef.current.uniforms.visible.value = layers.atmosphereGlow ? 1.0 : 0.0;
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

      // SST Anomaly Plumes Pulsing
      sstGroup.visible = layers.sstAnomalies;
      if (layers.sstAnomalies) {
        sstMeshes.forEach((mesh, idx) => {
          const s = 1.0 + Math.sin(elapsedSimSeconds * 2.5 + idx * 1.5) * 0.2;
          mesh.scale.set(s, s, s);
        });
      }

      // Hotspot Beacons Pulsing
      beaconsGroup.visible = layers.beacons;
      if (layers.beacons) {
        beaconMeshes.forEach(({ ring }, idx) => {
          const s = 1.0 + Math.sin(elapsedSimSeconds * 3.0 + idx) * 0.25;
          ring.scale.set(s, s, 1);
        });
      }

      // Planetary Orbital Rotation
      if (autoRotate && !isDragging && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.0016;
      }

      renderer.render(scene, camera);

      // Telemetry update
      if (Math.floor(elapsedSimSeconds * 10) % 6 === 0) {
        const kolkataVec = latLonToVector3(22.57, 88.36, 1.0).normalize();
        const kolkataSunDot = kolkataVec.dot(sunVec);
        const solarZenithDeg = (Math.acos(Math.max(-1, Math.min(1, kolkataSunDot))) * 180) / Math.PI;

        setSimTelemetry({
          utcTime: now.toISOString().slice(11, 19) + " UTC",
          subsolarLon: `${subsolarLonDeg.toFixed(1)}°`,
          subsolarLat: `${subsolarLatDeg >= 0 ? "+" : ""}${subsolarLatDeg.toFixed(1)}°`,
          kolkataSolarAngle: `${solarZenithDeg.toFixed(0)}° ${kolkataSunDot > 0 ? "Zenith" : "Nadir"}`,
          isKolkataDay: kolkataSunDot > -0.1,
          cloudDriftStatus: "Tropical Trade Wind & Jet Stream Advection Active",
        });
      }
    };

    animate();

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

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", handlePointerDown);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      domElement.removeEventListener("wheel", handleWheel);
      domElement.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      resizeObserver.disconnect();

      renderer.dispose();
      sphereGeo.dispose();
      earthShaderMat.dispose();
      cloudsGeo.dispose();
      cloudsShaderMat.dispose();
      atmosphereGeo.dispose();
      atmosphereShaderMat.dispose();
      moistureLineGeo.dispose();
      moistureLineMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      fallbackDay.dispose();
      fallbackNight.dispose();
    };
  }, [
    autoRotate,
    simSpeed,
    layers.clouds,
    layers.cloudShadows,
    layers.terminator,
    layers.atmosphereGlow,
    layers.specularGlint,
    layers.sstAnomalies,
    layers.vaporStream,
    layers.beacons,
  ]);

  const handleZoom = (direction: "in" | "out") => {
    const step = 28;
    if (direction === "in") {
      targetCameraZRef.current = Math.max(76, targetCameraZRef.current - step);
    } else {
      targetCameraZRef.current = Math.min(320, targetCameraZRef.current + step);
    }
    setZoomLevel(Number((210 / targetCameraZRef.current).toFixed(2)));
  };

  const resetView = () => {
    if (!globeGroupRef.current || !cameraRef.current) return;
    globeGroupRef.current.rotation.y = -Math.PI * 0.45;
    globeGroupRef.current.rotation.x = 0.22;
    targetCameraZRef.current = 210;
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
    targetCameraZRef.current = spot.id === "kolkata" ? 140 : 160;
    setZoomLevel(Number((210 / targetCameraZRef.current).toFixed(2)));
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#02040a] border border-cyan-500/25 overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Top Operations Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-[#070d1e]/90 gap-2 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 tracking-wider uppercase flex items-center gap-1.5 font-sans text-sm">
              <Satellite className="w-4 h-4 text-cyan-400" />
              Photorealistic Earth & Real-Time Fluid Cloud Dynamics
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              BLUE MARBLE SATELLITE • ATMOSPHERIC CLOUD CIRCULATION • SHADOW PROJECTION • RAYLEIGH LIMB
            </span>
          </div>
        </div>

        {/* Live Simulation Speed Selector & Camera Controls */}
        <div className="flex items-center gap-2">
          {satelliteSourceLoaded && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold">
              <Sparkles className="w-2.5 h-2.5" />
              NASA SATELLITE FEED
            </span>
          )}

          {/* Time Warp Speed Selector */}
          <div className="flex items-center bg-[#050811] border border-[#1c2638] p-0.5 rounded text-[10px]">
            {(["1x", "60x", "1440x"] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  simSpeed === speed
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={speed === "1x" ? "Real-Time 1:1 Cloud Motion" : `${speed} Accelerated Weather System Drift`}
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

      {/* Real-time Astronomical & Cloud Telemetry Strip */}
      <div className="px-3.5 py-1.5 bg-[#050a14] border-b border-slate-800/70 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">UTC:</span>
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
          <span className="text-slate-700 hidden md:inline">•</span>
          <div className="hidden md:flex items-center gap-1.5 text-cyan-300">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>CLOUD CIRCULATION: ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">KOLKATA:</span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                simTelemetry.isKolkataDay
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                  : "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40"
              }`}
            >
              {simTelemetry.isKolkataDay ? "DAYLIGHT (SOLAR FLUX)" : "NIGHT (CITY LIGHTS)"}
            </span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="text-slate-400">
            ZENITH: <span className="text-sky-300 font-bold">{simTelemetry.kolkataSolarAngle}</span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        style={{ touchAction: "none" }}
        className="w-full h-[420px] sm:h-[500px] cursor-grab active:cursor-grabbing relative overflow-hidden select-none"
      />

      {/* Live Simulation Layer Filters */}
      <div className="p-3 bg-[#070d1e]/90 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="text-slate-400 mr-1 uppercase flex items-center gap-1 font-bold">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            LAYERS:
          </span>
          <button
            onClick={() => toggleLayer("clouds")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.clouds
                ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            FLUID CLOUDS
          </button>
          <button
            onClick={() => toggleLayer("cloudShadows")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.cloudShadows
                ? "bg-sky-950/60 text-sky-300 border-sky-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            CLOUD SHADOWS
          </button>
          <button
            onClick={() => toggleLayer("atmosphereGlow")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.atmosphereGlow
                ? "bg-blue-950/60 text-blue-300 border-blue-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            RAYLEIGH LIMB
          </button>
          <button
            onClick={() => toggleLayer("terminator")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.terminator
                ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            DAY / NIGHT
          </button>
          <button
            onClick={() => toggleLayer("specularGlint")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.specularGlint
                ? "bg-sky-950/40 text-sky-300 border-sky-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            OCEAN GLINT
          </button>
          <button
            onClick={() => toggleLayer("vaporStream")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.vaporStream
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            MONSOON JETS
          </button>
          <button
            onClick={() => toggleLayer("sstAnomalies")}
            className={`px-2 py-0.5 rounded border cursor-pointer transition ${
              layers.sstAnomalies
                ? "bg-amber-950/40 text-amber-300 border-amber-500/50 font-bold"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            SST THERMAL PLUMES
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400">
          Zoom: <span className="text-cyan-400 font-bold">{zoomLevel}x</span> | Mouse Wheel / Pinch to Zoom (3D View Only)
        </div>
      </div>

      {/* Interactive Teleconnection Hotspot Pills */}
      <div className="p-3 bg-slate-950/95 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              onClick={() => focusHotspot(spot)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                activeHotspot.id === spot.id
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold"
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
      <div className="p-3.5 bg-[#030712] border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
