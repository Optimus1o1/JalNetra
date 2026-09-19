"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Waves, ShieldAlert, CheckCircle, RotateCw, Compass, Eye, Gauge, ArrowDownUp } from "lucide-react";

/**
 * Creates a high-resolution vertical flood level staff gauge texture
 * with meter and decimeter graduations, crest breach line (+2.80m),
 * and high-tide warning indicator (+5.42m).
 */
function createStaffGaugeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background: Weathered enamel cream-white
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 128, 1024);

  // Side border rails
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 8, 1024);
  ctx.fillRect(120, 0, 8, 1024);

  // Meter graduations from 0.0m (bottom) to 6.0m (top)
  const totalMeters = 6.0;
  for (let m = 0; m <= totalMeters; m += 0.1) {
    const y = 1024 - (m / totalMeters) * 1024;
    const isMeter = Math.abs(m - Math.round(m)) < 0.01;
    const isHalfMeter = Math.abs(m - Math.round(m) - 0.5) < 0.01;

    ctx.fillStyle = "#0f172a";
    if (isMeter) {
      // Major meter bar
      ctx.fillRect(8, y - 3, 48, 6);
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText(`${Math.round(m)}m`, 62, y + 9);
    } else if (isHalfMeter) {
      // Half-meter bar
      ctx.fillRect(8, y - 2, 34, 4);
    } else {
      // Decimeter tick
      ctx.fillRect(8, y - 1, 20, 2);
    }
  }

  // Critical Flood Embankment Crest line at +2.80m
  const crestY = 1024 - (2.80 / totalMeters) * 1024;
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(8, crestY - 4, 112, 8);
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#dc2626";
  ctx.fillText("CREST 2.8m", 16, crestY - 10);

  // Spring High Tide Level at +5.42m
  const tideY = 1024 - (5.42 / totalMeters) * 1024;
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(8, tideY - 4, 112, 8);
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#0369a1";
  ctx.fillText("SURGE 5.4m", 16, tideY - 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export type CameraPreset = "iso" | "river" | "canal" | "gantry";

export const HydraulicSluiceGate3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gateState, setGateState] = useState<"locked" | "open">("locked");
  const [riverLevelM, setRiverLevelM] = useState<number>(5.42);
  const [canalLevelM, setCanalLevelM] = useState<number>(3.15);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("iso");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gateGroupRef = useRef<THREE.Group | null>(null);
  const leftPistonRodRef = useRef<THREE.Mesh | null>(null);
  const rightPistonRodRef = useRef<THREE.Mesh | null>(null);
  const riverWaterRef = useRef<THREE.Mesh | null>(null);
  const canalWaterRef = useRef<THREE.Mesh | null>(null);
  const frothMeshRef = useRef<THREE.Mesh | null>(null);
  const particleGroupRef = useRef<THREE.Points | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const beaconLightRef = useRef<THREE.PointLight | null>(null);
  const beaconMeshRef = useRef<THREE.Mesh | null>(null);

  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(75, 55, 95));
  const targetCameraLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 12, 0));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040813);
    scene.fog = new THREE.FogExp2(0x040813, 0.0035);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 1000);
    camera.position.set(75, 55, 95);
    camera.lookAt(0, 12, 0);
    cameraRef.current = camera;

    // 2. High-Fidelity WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Main Scene Group
    const mainGroup = new THREE.Group();
    groupRef.current = mainGroup;
    scene.add(mainGroup);

    // 4. Texture Loader & Material Setup
    const textureLoader = new THREE.TextureLoader();

    // Weathered Hydraulic Concrete Pier Texture
    const concreteTex = textureLoader.load("/textures/concrete_pier.jpg");
    concreteTex.wrapS = THREE.RepeatWrapping;
    concreteTex.wrapT = THREE.RepeatWrapping;
    concreteTex.repeat.set(2, 2);

    const concreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.85,
      metalness: 0.12,
      color: 0xd4d4d8,
    });

    // Darkened foundation concrete for wet submerged zones
    const wetConcreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.45,
      metalness: 0.2,
      color: 0x71717a,
    });

    // Heavy Industrial Steel Sluice Gate Texture
    const steelGateTex = textureLoader.load("/textures/steel_gate_leaf.jpg");
    const steelGateMat = new THREE.MeshStandardMaterial({
      map: steelGateTex,
      roughness: 0.35,
      metalness: 0.75,
      color: 0xffffff,
    });

    // Galvanized Industrial Steel for Gantry Towers & Frames
    const steelTrussMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.35,
    });

    // Safety Warning Yellow for Railings and Hoist Covers
    const safetyYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.4,
      roughness: 0.4,
    });

    // Mirror-Polished Chrome for Hydraulic Pushrods
    const chromePistonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.08,
    });

    // Heavy Cylinder Body Industrial Paint (Hydraulic Actuator)
    const hydraulicCylinderMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Industrial dark green SCADA casing
      metalness: 0.5,
      roughness: 0.4,
    });

    // Staff Gauge Ruler Texture
    const staffGaugeTex = createStaffGaugeTexture();
    const staffGaugeMat = new THREE.MeshBasicMaterial({
      map: staffGaugeTex,
      transparent: true,
    });

    // =========================================================================
    // 5. CIVIL ENGINEERING CONCRETE INFRASTRUCTURE
    // =========================================================================

    // 5a. Channel Bed Base Slab & Spillway Apron
    const bedGeo = new THREE.BoxGeometry(130, 6, 60);
    const bedMesh = new THREE.Mesh(bedGeo, wetConcreteMat);
    bedMesh.position.set(0, -3, 0);
    bedMesh.receiveShadow = true;
    mainGroup.add(bedMesh);

    // 5b. Massive Concrete Abutment Piers (Left & Right)
    const pierWidth = 14;
    const pierHeight = 44;
    const pierLength = 54;

    // Left Pier
    const leftPierGeo = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const leftPier = new THREE.Mesh(leftPierGeo, concreteMat);
    leftPier.position.set(0, 19, -29);
    leftPier.castShadow = true;
    leftPier.receiveShadow = true;
    mainGroup.add(leftPier);

    // Right Pier
    const rightPierGeo = new THREE.BoxGeometry(pierWidth, pierHeight, pierLength);
    const rightPier = new THREE.Mesh(rightPierGeo, concreteMat);
    rightPier.position.set(0, 19, 29);
    rightPier.castShadow = true;
    rightPier.receiveShadow = true;
    mainGroup.add(rightPier);

    // 5c. Steel Vertical Gate Guide Slots (Recessed Channels in Inner Pier Faces)
    const guideSlotGeo = new THREE.BoxGeometry(6, 42, 3.5);
    const guideSlotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    const leftGuideSlot = new THREE.Mesh(guideSlotGeo, guideSlotMat);
    leftGuideSlot.position.set(0, 20, -21);
    mainGroup.add(leftGuideSlot);

    const rightGuideSlot = new THREE.Mesh(guideSlotGeo, guideSlotMat);
    rightGuideSlot.position.set(0, 20, 21);
    mainGroup.add(rightGuideSlot);

    // 5d. Wing Walls (Flaring out at 45 degrees into Hooghly and Canal)
    const wingWallGeo = new THREE.BoxGeometry(26, 32, 6);
    // Upstream River Left Wing Wall
    const wingWall1 = new THREE.Mesh(wingWallGeo, concreteMat);
    wingWall1.position.set(-38, 13, -36);
    wingWall1.rotation.y = -Math.PI / 6;
    mainGroup.add(wingWall1);

    // Upstream River Right Wing Wall
    const wingWall2 = new THREE.Mesh(wingWallGeo, concreteMat);
    wingWall2.position.set(-38, 13, 36);
    wingWall2.rotation.y = Math.PI / 6;
    mainGroup.add(wingWall2);

    // Downstream Canal Left Wing Wall
    const wingWall3 = new THREE.Mesh(wingWallGeo, concreteMat);
    wingWall3.position.set(38, 13, -36);
    wingWall3.rotation.y = Math.PI / 6;
    mainGroup.add(wingWall3);

    // Downstream Canal Right Wing Wall
    const wingWall4 = new THREE.Mesh(wingWallGeo, concreteMat);
    wingWall4.position.set(38, 13, 36);
    wingWall4.rotation.y = -Math.PI / 6;
    mainGroup.add(wingWall4);

    // 5e. Concrete Spillway Ogee Sill Crest
    const sillGeo = new THREE.BoxGeometry(6, 4, 40);
    const sillMesh = new THREE.Mesh(sillGeo, wetConcreteMat);
    sillMesh.position.set(0, 1.5, 0);
    mainGroup.add(sillMesh);

    // 5f. Vertical Water Level Staff Gauge Board (Mounted on Riverward Pier Face)
    const staffGaugeGeo = new THREE.PlaneGeometry(3.6, 28);
    const staffGaugeMesh = new THREE.Mesh(staffGaugeGeo, staffGaugeMat);
    staffGaugeMesh.position.set(-7.1, 15, -21.8);
    staffGaugeMesh.rotation.y = -Math.PI / 2;
    mainGroup.add(staffGaugeMesh);

    // =========================================================================
    // 6. OVERHEAD GANTRY CRANE, WALKWAY & HYDRAULIC ACTUATORS
    // =========================================================================

    // 6a. Gantry Steel H-Beam Columns
    const gantryColGeo = new THREE.BoxGeometry(4, 38, 4);

    // 4 Corner Gantry Columns
    const gc1 = new THREE.Mesh(gantryColGeo, steelTrussMat);
    gc1.position.set(-3.5, 52, -22);
    mainGroup.add(gc1);

    const gc2 = new THREE.Mesh(gantryColGeo, steelTrussMat);
    gc2.position.set(3.5, 52, -22);
    mainGroup.add(gc2);

    const gc3 = new THREE.Mesh(gantryColGeo, steelTrussMat);
    gc3.position.set(-3.5, 52, 22);
    mainGroup.add(gc3);

    const gc4 = new THREE.Mesh(gantryColGeo, steelTrussMat);
    gc4.position.set(3.5, 52, 22);
    mainGroup.add(gc4);

    // 6b. Gantry Top Machine Deck Platform
    const deckGeo = new THREE.BoxGeometry(16, 3, 62);
    const deckMesh = new THREE.Mesh(deckGeo, steelTrussMat);
    deckMesh.position.set(0, 71, 0);
    mainGroup.add(deckMesh);

    // 6c. Safety Handrails (Yellow Tubular Railings)
    const railFrontGeo = new THREE.BoxGeometry(15, 3.5, 0.8);
    const rf1 = new THREE.Mesh(railFrontGeo, safetyYellowMat);
    rf1.position.set(0, 74, -30.5);
    mainGroup.add(rf1);

    const rf2 = new THREE.Mesh(railFrontGeo, safetyYellowMat);
    rf2.position.set(0, 74, 30.5);
    mainGroup.add(rf2);

    const railSideGeo = new THREE.BoxGeometry(0.8, 3.5, 61);
    const rs1 = new THREE.Mesh(railSideGeo, safetyYellowMat);
    rs1.position.set(-7.5, 74, 0);
    mainGroup.add(rs1);

    const rs2 = new THREE.Mesh(railSideGeo, safetyYellowMat);
    rs2.position.set(7.5, 74, 0);
    mainGroup.add(rs2);

    // 6d. Winch Motor Housing & Cable Drums
    const motorBoxGeo = new THREE.BoxGeometry(8, 7, 14);
    const motorBox = new THREE.Mesh(motorBoxGeo, hydraulicCylinderMat);
    motorBox.position.set(0, 76, 0);
    mainGroup.add(motorBox);

    // 6e. Operational Warning Beacon Light
    const beaconLight = new THREE.PointLight(0xf59e0b, 2.5, 35);
    beaconLight.position.set(0, 81, 0);
    mainGroup.add(beaconLight);
    beaconLightRef.current = beaconLight;

    const beaconGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 80.5, 0);
    mainGroup.add(beaconMesh);
    beaconMeshRef.current = beaconMesh;

    // 6f. Dual Hydraulic Cylinder Actuators (Left & Right)
    const cylGeo = new THREE.CylinderGeometry(2.2, 2.2, 24, 20);

    const leftCyl = new THREE.Mesh(cylGeo, hydraulicCylinderMat);
    leftCyl.position.set(0, 58, -12);
    mainGroup.add(leftCyl);

    const rightCyl = new THREE.Mesh(cylGeo, hydraulicCylinderMat);
    rightCyl.position.set(0, 58, 12);
    mainGroup.add(rightCyl);

    // Hydraulic Pushrods (Chrome Telescoping Rods)
    const pistonGeo = new THREE.CylinderGeometry(1.1, 1.1, 30, 20);

    const leftPiston = new THREE.Mesh(pistonGeo, chromePistonMat);
    leftPiston.position.set(0, 36, -12);
    mainGroup.add(leftPiston);
    leftPistonRodRef.current = leftPiston;

    const rightPiston = new THREE.Mesh(pistonGeo, chromePistonMat);
    rightPiston.position.set(0, 36, 12);
    mainGroup.add(rightPiston);
    rightPistonRodRef.current = rightPiston;

    // =========================================================================
    // 7. REALISTIC STRUCTURAL STEEL SLUICE GATE LEAF (VERTICAL LIFT)
    // =========================================================================
    const gateGroup = new THREE.Group();
    gateGroupRef.current = gateGroup;

    // Main Gate Face (Mapped with authentic riveted steel & hazard stripe image)
    const gatePlateGeo = new THREE.BoxGeometry(3.2, 26, 41.5);
    const gatePlateMesh = new THREE.Mesh(gatePlateGeo, steelGateMat);
    gatePlateMesh.castShadow = true;
    gatePlateMesh.receiveShadow = true;
    gateGroup.add(gatePlateMesh);

    // 3D Physical Structural I-Beam Stiffeners running across the gate face
    const beamCount = 4;
    for (let i = 0; i < beamCount; i++) {
      const beamY = -9 + i * 6;
      const hBeamGeo = new THREE.BoxGeometry(1.8, 1.4, 40.5);
      const hBeamMesh = new THREE.Mesh(hBeamGeo, steelTrussMat);
      hBeamMesh.position.set(1.8, beamY, 0);
      gateGroup.add(hBeamMesh);

      // Flange lip
      const flangeGeo = new THREE.BoxGeometry(0.5, 2.2, 40.5);
      const flangeMesh = new THREE.Mesh(flangeGeo, steelTrussMat);
      flangeMesh.position.set(2.8, beamY, 0);
      gateGroup.add(flangeMesh);
    }

    // Top Hoist Attachment Lug Eyes
    const lugGeo = new THREE.BoxGeometry(2, 4, 3);
    const leftLug = new THREE.Mesh(lugGeo, steelTrussMat);
    leftLug.position.set(0, 14, -12);
    gateGroup.add(leftLug);

    const rightLug = new THREE.Mesh(lugGeo, steelTrussMat);
    rightLug.position.set(0, 14, 12);
    gateGroup.add(rightLug);

    // Rubber Bottom Knife-Edge Sill Seal
    const sealGeo = new THREE.BoxGeometry(3.6, 1.2, 41.5);
    const sealMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.set(0, -13.2, 0);
    gateGroup.add(sealMesh);

    // Initial Gate Elevation
    gateGroup.position.set(0, gateState === "locked" ? 14 : 32, 0);
    mainGroup.add(gateGroup);

    // =========================================================================
    // 8. DUAL HYDRODYNAMIC WATER BODIES: HOOGHLY TIDAL SURGE VS INLAND CANAL
    // =========================================================================

    // 8a. Upstream Hooghly Estuary Water (Tidal Surge +5.42m MSL)
    const riverGeo = new THREE.PlaneGeometry(62, 41, 48, 36);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Deep marine-estuarine blue
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
    });
    const riverWater = new THREE.Mesh(riverGeo, riverMat);
    riverWater.rotation.x = -Math.PI / 2;
    riverWater.position.set(-34, gateState === "locked" ? 22 : 9, 0);
    riverWater.receiveShadow = true;
    mainGroup.add(riverWater);
    riverWaterRef.current = riverWater;

    // 8b. Downstream Inland Drainage Canal (Chetla / Topsia Basin Sump)
    const canalGeo = new THREE.PlaneGeometry(62, 41, 48, 36);
    const canalMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan canal runoff
      roughness: 0.22,
      metalness: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const canalWater = new THREE.Mesh(canalGeo, canalMat);
    canalWater.rotation.x = -Math.PI / 2;
    canalWater.position.set(34, 12.5, 0);
    canalWater.receiveShadow = true;
    mainGroup.add(canalWater);
    canalWaterRef.current = canalWater;

    // 8c. Under-Gate Outfall Aeration Whitewater & Froth (Visible when raised)
    const frothGeo = new THREE.PlaneGeometry(16, 40, 16, 16);
    const frothMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: gateState === "open" ? 0.75 : 0.0,
      blending: THREE.AdditiveBlending,
    });
    const frothMesh = new THREE.Mesh(frothGeo, frothMat);
    frothMesh.rotation.x = -Math.PI / 2;
    frothMesh.position.set(8, 12.6, 0);
    mainGroup.add(frothMesh);
    frothMeshRef.current = frothMesh;

    // 8d. Hydraulic Flow Streamline Particles
    const pCount = 380;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pVelocities = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 110;
      pPositions[i * 3 + 1] = 4 + Math.random() * 8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 38;
      pVelocities[i] = 0.8 + Math.random() * 2.2;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 1.8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const pPoints = new THREE.Points(pGeo, pMat);
    mainGroup.add(pPoints);
    particleGroupRef.current = pPoints;

    // =========================================================================
    // 9. LIGHTING & ENVIRONMENT SHADOWS
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    sunLight.position.set(65, 85, 55);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(-60, 40, -40);
    scene.add(fillLight);

    // =========================================================================
    // 10. INTERACTIVE POINTER ORBIT & DRAG CONTROLS
    // =========================================================================
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

      groupRef.current.rotation.y += dx * 0.0075;
      const nextX = groupRef.current.rotation.x + dy * 0.0055;
      groupRef.current.rotation.x = Math.max(-0.25, Math.min(0.65, nextX));

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

    // =========================================================================
    // 11. HIGH-PRECISION REAL-TIME ANIMATION LOOP
    // =========================================================================
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.035;

      // Smooth Camera Preset Transition
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, 0.08);
        cameraRef.current.lookAt(targetCameraLook.current);
      }

      // Dynamic Water Surface Rippling
      if (riverWaterRef.current && canalWaterRef.current) {
        const targetRiverY = gateState === "locked" ? 22 : 9;
        riverWaterRef.current.position.y += (targetRiverY - riverWaterRef.current.position.y) * 0.06;
        riverWaterRef.current.position.y += Math.sin(time * 1.5) * 0.25;

        canalWaterRef.current.position.y = 12.5 + Math.cos(time * 1.2) * 0.18;
      }

      // Smooth Gate Leaf Elevation Transition
      if (gateGroupRef.current) {
        const targetGateY = gateState === "locked" ? 14 : 32;
        gateGroupRef.current.position.y += (targetGateY - gateGroupRef.current.position.y) * 0.08;

        // Synchronize chrome piston rods
        if (leftPistonRodRef.current && rightPistonRodRef.current) {
          const pistonY = 36 + (gateGroupRef.current.position.y - 14) * 0.5;
          leftPistonRodRef.current.position.y = pistonY;
          rightPistonRodRef.current.position.y = pistonY;
        }
      }

      // Froth opacity interpolation
      if (frothMeshRef.current) {
        const targetFrothOp = gateState === "open" ? 0.75 : 0.0;
        const mat = frothMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity += (targetFrothOp - mat.opacity) * 0.08;
      }

      // Pulsing Beacon Light
      if (beaconLightRef.current && beaconMeshRef.current) {
        if (gateState === "locked") {
          // Warning amber strobe
          beaconLightRef.current.color.setHex(0xf59e0b);
          (beaconMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
          const intensity = 1.8 + Math.sin(time * 6.0) * 1.5;
          beaconLightRef.current.intensity = Math.max(0.4, intensity);
        } else {
          // Normal operational green
          beaconLightRef.current.color.setHex(0x10b981);
          (beaconMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
          beaconLightRef.current.intensity = 2.0;
        }
      }

      // Hydrodynamic Flow Streamline Particles
      if (particleGroupRef.current) {
        const pos = particleGroupRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          if (gateState === "open") {
            // Rapid high-velocity gravity outfall through gate aperture
            pos[i * 3] += pVelocities[i] * 1.25;
            if (pos[i * 3] > 55) pos[i * 3] = -55;
          } else {
            // High-tide surge barrier pressure oscillation
            pos[i * 3] += Math.sin(time + i) * 0.12;
          }
        }
        particleGroupRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Observer
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
      concreteMat.dispose();
      wetConcreteMat.dispose();
      steelGateMat.dispose();
      steelTrussMat.dispose();
      safetyYellowMat.dispose();
      chromePistonMat.dispose();
      hydraulicCylinderMat.dispose();
      staffGaugeMat.dispose();
      riverMat.dispose();
      canalMat.dispose();
      frothMat.dispose();
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

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
    }

    switch (preset) {
      case "iso":
        targetCameraPos.current.set(75, 55, 95);
        targetCameraLook.current.set(0, 12, 0);
        break;
      case "river":
        targetCameraPos.current.set(-85, 35, 10);
        targetCameraLook.current.set(0, 16, 0);
        break;
      case "canal":
        targetCameraPos.current.set(85, 30, 10);
        targetCameraLook.current.set(0, 16, 0);
        break;
      case "gantry":
        targetCameraPos.current.set(0, 95, 25);
        targetCameraLook.current.set(0, 20, 0);
        break;
    }
  };

  const headDelta = Number((riverLevelM - canalLevelM).toFixed(2));

  return (
    <div className="relative w-full rounded-2xl bg-[#02050f] border border-cyan-500/25 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Top Operations HUD & SCADA Interlock Controller Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-slate-800/80 bg-[#060b18]/95 z-10 gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${gateState === "locked" ? "bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" : "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"}`} />
          <div>
            <span className="font-bold text-slate-100 tracking-wider uppercase font-sans text-xs sm:text-sm flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              SLUICE GATE 04 • HOOGHLY-CANAL ESTUARY INTERLOCK
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              GARDEN REACH CONFLUENCE • SCADA HYDRAULIC ACTUATOR • FLOOD SURGE BARRIER
            </span>
          </div>
        </div>

        {/* Camera Preset Quick Switchers & Gate Actuator Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Camera View Angle Selector */}
          <div className="flex items-center bg-[#040816] border border-slate-800 p-0.5 rounded text-[11px] font-mono">
            <button
              onClick={() => applyCameraPreset("iso")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${cameraPreset === "iso" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"}`}
              title="Isometric Perspective"
            >
              ISO
            </button>
            <button
              onClick={() => applyCameraPreset("river")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${cameraPreset === "river" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"}`}
              title="Upstream Hooghly River View"
            >
              RIVER
            </button>
            <button
              onClick={() => applyCameraPreset("canal")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${cameraPreset === "canal" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"}`}
              title="Downstream Inland Canal View"
            >
              CANAL
            </button>
            <button
              onClick={() => applyCameraPreset("gantry")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${cameraPreset === "gantry" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"}`}
              title="Top Gantry Hoist Overhead View"
            >
              GANTRY
            </button>
          </div>

          {/* Reset Orbit Angle Button */}
          <button
            onClick={() => applyCameraPreset("iso")}
            title="Reset to Default Angle"
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Gate Actuator Toggle Button */}
          <button
            onClick={() => toggleGate(gateState === "locked" ? "open" : "locked")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              gateState === "locked"
                ? "bg-rose-950/80 text-rose-200 border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:bg-rose-900/90"
                : "bg-emerald-950/80 text-emerald-200 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-900/90"
            }`}
          >
            {gateState === "locked" ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>INTERLOCK ENGAGED (BACKFLOW BLOCKED)</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>GATE RAISED (GRAVITY OUTFALL ACTIVE)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[380px] sm:h-[450px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Architectural Callout Overlays */}
      <div className="absolute bottom-16 left-3.5 z-10 pointer-events-none hidden sm:flex flex-col gap-1.5">
        <div className="px-2.5 py-1 rounded bg-slate-950/85 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 backdrop-blur-md shadow-lg flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>UPSTREAM: HOOGHLY ESTUARY (+{riverLevelM}m MSL)</span>
        </div>
        <div className="px-2.5 py-1 rounded bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-md shadow-lg flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>DOWNSTREAM: CHETLA CANAL BASIN (+{canalLevelM}m MSL)</span>
        </div>
      </div>

      {/* Interactive Drag & Orbit Tip */}
      <div className="absolute bottom-16 right-3.5 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-[10px] font-mono text-slate-400">
        <span>Click & drag to inspect 3D structure • Switch angles above</span>
      </div>

      {/* Hydraulic Stage Telemetry Grid */}
      <div className="p-3.5 bg-[#030612]/95 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 shadow-xs">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">HOOGHLY RIVER STAGE</div>
          <div className="text-cyan-300 font-bold text-base mt-0.5 font-sans flex items-center gap-1">
            <span>+{riverLevelM.toFixed(2)} m</span>
            <span className="text-[10px] font-mono text-slate-400">MSL</span>
          </div>
          <div className={`text-[10px] font-semibold mt-0.5 ${riverLevelM >= 5.0 ? "text-rose-400" : "text-slate-400"}`}>
            {gateState === "locked" ? "Spring High Tide Surge Warning" : "Low Ebb Tide Outfall Window"}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 shadow-xs">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">CANAL DISCHARGE HEAD</div>
          <div className="text-cyan-300 font-bold text-base mt-0.5 font-sans flex items-center gap-1">
            <span>+{canalLevelM.toFixed(2)} m</span>
            <span className="text-[10px] font-mono text-slate-400">MSL</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Chetla / Topsia Basin Outfall Sump
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 shadow-xs">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">HEAD DIFFERENTIAL (ΔH)</div>
          <div
            className={`font-bold text-base mt-0.5 font-sans flex items-center gap-1 ${
              headDelta > 0 ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            <span>{headDelta > 0 ? "+" : ""}{headDelta.toFixed(2)} m</span>
          </div>
          <div className={`text-[10px] font-semibold mt-0.5 ${headDelta > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {headDelta > 0 ? "⚠️ REVERSE GRADIENT (BACKFLOW RISK)" : "✓ POSITIVE GRAVITY GRADIENT"}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 shadow-xs">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">SCADA INTERLOCK DISPATCH</div>
          <div
            className={`font-bold text-xs mt-1 uppercase ${
              gateState === "locked" ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {gateState === "locked" ? "LOCKED // PREVENT_BACKFLOW" : "DISCHARGE // 24.5 M³/S"}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Actuator: Dual-Hydraulic Chrome Piston
          </div>
        </div>
      </div>
    </div>
  );
};
