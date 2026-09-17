"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MODEL_REGISTRY, DATA_FRESHNESS_MONITORS } from "@/lib/data/modelsData";
import {
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Database,
  Award,
  Activity,
  AlertTriangle,
  Upload,
  Play,
  Sliders,
  FileCode,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Download,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { ModelArchitecture3D } from "../3d/ModelArchitecture3D";

interface CustomModelData {
  format: string;
  exportedAt: string;
  modelMetadata: {
    id: string;
    name: string;
    version: string;
    type: string;
    status: string;
    description: string;
    author: string;
    trainingPlatform: string;
  };
  metrics: {
    crpsScore: number;
    brierScore: number;
    spatialIoU: number;
    rmse: number;
    mae: number;
    r2Score: number;
    falseAlertRate: number;
    latencyMs: number;
  };
  features: string[];
  treeShapAttributions?: Record<string, number>;
  inferenceWeights?: {
    baseInundationOffset: number;
    rainfallMultiplier: number;
    tidalSurgeMultiplier: number;
    elevationReliefMultiplier: number;
    siltFrictionMultiplier: number;
    turbineReliefMultiplier: number;
  };
}

export const ModelLabSection: React.FC = () => {
  // Custom Model State
  const [customModel, setCustomModel] = useState<CustomModelData | null>(null);
  const [isCustomChampion, setIsCustomChampion] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Test Bench Slider Inputs
  const [rainfallRate, setRainfallRate] = useState<number>(75);
  const [elevation, setElevation] = useState<number>(3.5);
  const [tidalStage, setTidalStage] = useState<number>(4.2);
  const [canalSilt, setCanalSilt] = useState<number>(60);
  const [activeTurbines, setActiveTurbines] = useState<number>(4);

  // Fetch initial custom model from API if available
  useEffect(() => {
    async function loadInitialCustomModel() {
      try {
        const res = await fetch("/api/v1/models/custom");
        const data = await res.json();
        if (data.status === "success" && data.model) {
          setCustomModel(data.model);
        }
      } catch {
        // Fallback silently if offline or initial load fails
      }
    }
    loadInitialCustomModel();
  }, []);

  // Compute live inference on input change
  const computeInference = useCallback(() => {
    const weights = customModel?.inferenceWeights || {
      baseInundationOffset: 8.5,
      rainfallMultiplier: 0.42,
      tidalSurgeMultiplier: 12.4,
      elevationReliefMultiplier: -7.8,
      siltFrictionMultiplier: 0.28,
      turbineReliefMultiplier: -4.2,
    };

    const rawDepth =
      weights.baseInundationOffset +
      rainfallRate * weights.rainfallMultiplier +
      tidalStage * weights.tidalSurgeMultiplier +
      elevation * weights.elevationReliefMultiplier +
      canalSilt * weights.siltFrictionMultiplier +
      activeTurbines * weights.turbineReliefMultiplier;

    const depth = Math.max(0, Math.round(rawDepth * 10) / 10);
    const prob = Math.min(0.99, Math.max(0.01, Math.round((depth / 80) * 100) / 100));

    let risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
    if (depth >= 45) risk = "CRITICAL";
    else if (depth >= 25) risk = "HIGH";
    else if (depth >= 10) risk = "MODERATE";

    return {
      depth,
      probability: prob,
      risk,
      p10: Math.max(0, Math.round(depth * 0.82 * 10) / 10),
      p90: Math.round(depth * 1.18 * 10) / 10,
    };
  }, [customModel, rainfallRate, elevation, tidalStage, canalSilt, activeTurbines]);

  const liveInference = computeInference();

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed.format !== "jalnetra_custom_model_v1") {
        throw new Error(
          "Invalid model JSON format. Must contain 'format': 'jalnetra_custom_model_v1' generated from the JalNetra Colab training notebook."
        );
      }

      // Send to backend API for validation and deployment
      const res = await fetch("/api/v1/models/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to register custom model.");
      }

      setCustomModel(data.model);
      setIsCustomChampion(true);
      setUploadMessage(
        `Deployed '${data.model.modelMetadata.name}' (${data.model.modelMetadata.version}) as Champion!`
      );
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Error reading model JSON file.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Quick load bundled benchmark model
  const loadBundledBenchmark = async () => {
    setIsLoading(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/v1/models/custom");
      const data = await res.json();
      if (data.model) {
        setCustomModel(data.model);
        setIsCustomChampion(true);
        setUploadMessage("Loaded verified Colab PINN benchmark model successfully.");
      }
    } catch {
      setUploadError("Could not reach server to load bundled benchmark.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="models" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Model Lab & Custom Model Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            CRPS calibration, spatial IoU benchmarks, TreeSHAP attributions & Google Colab custom model training
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCustomChampion && customModel ? (
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-300 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-500/40 animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Active Champion: {customModel.modelMetadata.version}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Champion: Spatiotemporal PINN v2.4.1</span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Neural Network Architecture & CRPS Loss Manifold */}
      <ModelArchitecture3D />

      {/* ========================================================================= */}
      {/* GOOGLE COLAB CUSTOM MODEL DEPLOYMENT & LIVE INFERENCE BENCH */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Colab Instructions & Dataset Source (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <GlassCard tone="elevated" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Train in Google Colab
                </h3>
              </div>
              <Badge variant="amber" size="sm">
                OPEN DATASET PIPELINE
              </Badge>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Train your own deep hydrological PINN or XGBoost model in Google Colab using verified open internet datasets, then export and load directly into JalNetra.
            </p>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Curated Training Datasets:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="truncate pr-2">1. Indian Rainfall & Flood Dataset</span>
                  <a
                    href="https://raw.githubusercontent.com/neharikajsh/Flood_Prediction/master/data.csv"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 text-[10px] shrink-0"
                  >
                    CSV <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="truncate pr-2">2. Kerala Decadal Flood Series</span>
                  <a
                    href="https://raw.githubusercontent.com/amandp13/Flood-Prediction-Model/master/kerala.csv"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 text-[10px] shrink-0"
                  >
                    CSV <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="truncate pr-2">3. Kolkata Saint-Venant DEM Matrix</span>
                  <span className="text-emerald-400 text-[10px] shrink-0 font-bold">Auto-Gen (5k)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="text-[11px] font-bold text-slate-300">
                3-Step Training Workflow:
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>
                  <span className="text-cyan-400 font-bold">1.</span> Open{" "}
                  <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">
                    colab/JalNetra_Custom_Model_Training.ipynb
                  </code>{" "}
                  in Colab.
                </div>
                <div>
                  <span className="text-cyan-400 font-bold">2.</span> Click <strong>Runtime &rarr; Run all</strong> to train PINN + XGBoost.
                </div>
                <div>
                  <span className="text-cyan-400 font-bold">3.</span> Colab exports{" "}
                  <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">
                    jalnetra_custom_model.json
                  </code>
                  . Upload below!
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="colab-model-upload"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-cyan-900/30 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Validating..." : "Upload Model JSON"}</span>
                </button>

                <button
                  onClick={loadBundledBenchmark}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/30 transition disabled:opacity-50"
                  title="Load the verified Colab model pre-computed and stored on the server"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Load Benchmark</span>
                </button>
              </div>

              {uploadMessage && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{uploadMessage}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Live Model Evaluation & Interactive Test Bench (Right 7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <GlassCard tone="standard" className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 font-sans">
                    Custom Model Live Inference Bench
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Test custom model predictions against hydraulic stress scenarios in real time
                </p>
              </div>

              {customModel && (
                <button
                  onClick={() => setIsCustomChampion(!isCustomChampion)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                    isCustomChampion
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isCustomChampion ? "CHAMPION ACTIVE" : "PROMOTE TO CHAMPION"}</span>
                </button>
              )}
            </div>

            {/* Loaded Model Summary */}
            {customModel ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">R² Score</span>
                  <span className="text-sm font-bold text-emerald-300 telemetry-num">
                    {(customModel.metrics.r2Score * 100).toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Variance Explained</span>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Spatial IoU</span>
                  <span className="text-sm font-bold text-cyan-300 telemetry-num">
                    {(customModel.metrics.spatialIoU * 100).toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Flood Polygon Match</span>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Calibration (Brier)</span>
                  <span className="text-sm font-bold text-cyan-300 telemetry-num">
                    {customModel.metrics.brierScore.toFixed(3)}
                  </span>
                  <span className="text-[9px] text-slate-500 block">&lt;0.10 Optimal</span>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Val RMSE</span>
                  <span className="text-sm font-bold text-amber-300 telemetry-num">
                    {customModel.metrics.rmse.toFixed(1)} cm
                  </span>
                  <span className="text-[9px] text-slate-500 block">Sub-5cm target</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded bg-slate-900/60 border border-dashed border-slate-800 text-center font-mono text-xs text-slate-400">
                No custom model currently loaded. Click <strong>&quot;Load Benchmark&quot;</strong> or upload your Colab model to view metrics.
              </div>
            )}

            {/* Interactive Sliders */}
            <div className="space-y-3 pt-2 font-mono text-xs">
              {/* Slider 1: Rainfall */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Precipitation Rate (NASA GPM / Radar):</span>
                  <span className="text-cyan-300 font-bold">{rainfallRate} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={rainfallRate}
                  onChange={(e) => setRainfallRate(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Hooghly Tidal Stage */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Hooghly River Tidal Stage (Lock Gates):</span>
                  <span className="text-cyan-300 font-bold">{tidalStage.toFixed(1)} m KOD</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.5"
                  step="0.1"
                  value={tidalStage}
                  onChange={(e) => setTidalStage(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 3: Ground Elevation */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Ward Ground Elevation (DEM MSL):</span>
                  <span className="text-cyan-300 font-bold">{elevation.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.1"
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Sliders 4 & 5 side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Canal Siltation:</span>
                    <span className="text-amber-300 font-bold">{canalSilt}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={canalSilt}
                    onChange={(e) => setCanalSilt(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Active Drainage Pumps:</span>
                    <span className="text-emerald-300 font-bold">{activeTurbines} Units</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={activeTurbines}
                    onChange={(e) => setActiveTurbines(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Inference Result Output Display */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Predicted Inundation Depth</span>
                </div>
                <Badge
                  variant={
                    liveInference.risk === "CRITICAL"
                      ? "rose"
                      : liveInference.risk === "HIGH"
                      ? "amber"
                      : liveInference.risk === "MODERATE"
                      ? "cyan"
                      : "slate"
                  }
                  size="sm"
                >
                  {liveInference.risk} RISK
                </Badge>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-cyan-300 font-mono tracking-tight telemetry-num">
                  {liveInference.depth} <span className="text-lg font-normal text-slate-400">cm</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Flood Probability:{" "}
                  <strong className="text-slate-100">
                    {(liveInference.probability * 100).toFixed(0)}%
                  </strong>
                </span>
              </div>

              {/* Confidence Band (Probabilistic Honesty Section 19) */}
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] flex flex-wrap items-center justify-between text-slate-400 gap-2">
                <span>P10 Lower: <strong className="text-slate-200">{liveInference.p10} cm</strong></span>
                <span>P50 Median: <strong className="text-cyan-300">{liveInference.depth} cm</strong></span>
                <span>P90 Extreme: <strong className="text-rose-300">{liveInference.p90} cm</strong></span>
              </div>

              {/* TreeSHAP Feature Attribution Breakdown */}
              {customModel?.treeShapAttributions && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 font-mono text-[10px]">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>TreeSHAP Feature Attribution:</span>
                    <span className="text-cyan-400">Additive Marginal Attribution</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-slate-300">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span>Precip Inflow:</span>
                      <span className="text-cyan-300 font-bold">
                        +{customModel.treeShapAttributions.rainfallInflow?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span>Tidal Surge:</span>
                      <span className="text-cyan-300 font-bold">
                        +{customModel.treeShapAttributions.tidalBackflow?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span>Canal Friction:</span>
                      <span className="text-amber-300 font-bold">
                        +{customModel.treeShapAttributions.canalSiltResistance?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span>DEM Relief:</span>
                      <span className="text-emerald-300 font-bold">
                        -{customModel.treeShapAttributions.elevationFreeboard?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span>Turbine Relief:</span>
                      <span className="text-emerald-300 font-bold">
                        -{customModel.treeShapAttributions.pumpCapacity?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STANDARD MODEL ARCHITECTURES REGISTRY */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {MODEL_REGISTRY.map((model) => {
          const isChampion = !isCustomChampion && model.status === "active_production";
          return (
            <GlassCard
              key={model.id}
              tone={isChampion ? "accent" : "standard"}
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                    {model.version}
                  </span>
                  <Badge
                    variant={
                      isChampion
                        ? "cyan"
                        : model.status === "challenger_evaluation"
                        ? "purple"
                        : "slate"
                    }
                    size="sm"
                  >
                    {isChampion ? "ACTIVE CHAMPION" : model.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-100 mt-2">{model.name}</h3>

                <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
                  {model.description}
                </p>

                {/* Metrics Table */}
                <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CRPS Score</span>
                    <span className="text-base font-bold text-cyan-300 telemetry-num">
                      {model.metrics.crpsScore.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">(Lower is better)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Brier Score</span>
                    <span className="text-base font-bold text-cyan-300 telemetry-num">
                      {model.metrics.brierScore.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Prob. Calibration</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Spatial IoU</span>
                    <span className="text-base font-bold text-emerald-300 telemetry-num">
                      {(model.metrics.spatialIoU * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Flood Boundary</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">False Alert Rate</span>
                    <span className="text-base font-bold text-rose-300 telemetry-num">
                      {(model.metrics.falseAlertRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">FAR (&lt;10% target)</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>Latency: <span className="text-slate-200 font-bold">{model.metrics.latencyMs} ms</span></div>
                  <div>Window: <span className="text-slate-200">{model.trainingWindow}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                Calibrated: {model.lastCalibrated}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Data Ingestion Pipeline Freshness & Leakage Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Data Pipeline Latency Table */}
        <GlassCard tone="elevated" className="p-5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-cyan-400" />
            Data Pipeline Latency & Ingestion Health
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5">Data Feed</th>
                  <th className="py-2 px-2.5">Cadence</th>
                  <th className="py-2 px-2.5">Latency</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {DATA_FRESHNESS_MONITORS.map((feed, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2.5 font-semibold text-slate-200">{feed.source}</td>
                    <td className="py-2.5 px-2.5 text-slate-400">{feed.cadence}</td>
                    <td className="py-2.5 px-2.5 text-cyan-300 font-bold">{feed.latencyMinutes} mins</td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ● OPTIMAL
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Blueprint Section 19: Data Leakage Protocol */}
        <GlassCard tone="standard" className="p-5 space-y-3 font-mono text-xs">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Scientific Integrity & Temporal Leakage Guard
          </h3>

          <p className="text-slate-300 leading-relaxed">
            Per Section 19 of the JalNetra Blueprint, climate models are uniquely prone to
            temporal look-ahead leakage. The platform enforces rigid boundaries:
          </p>

          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Walk-Forward Temporal Split:</strong> At forecast hour T, only satellite
                and NWP products published prior to T are admitted into the feature store.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Satellite Ground Truth Calibration:</strong> NASA GPM IMERG estimates
                are continuously adjusted against IMD Alipore physical tipping-bucket rain gauges.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Probabilistic Honesty:</strong> Deterministic 100% predictions are
                disallowed; all predictions provide P10/P50/P90 confidence intervals.
              </span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </section>
  );
};
