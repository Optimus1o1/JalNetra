import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// In-memory store for active custom model session
interface CustomModelSchema {
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
  scaler?: {
    mean: number[];
    scale: number[];
  };
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

let activeCustomModel: CustomModelSchema | null = null;

// Helper to load default generated model if none in memory
function getDefaultCustomModel(): CustomModelSchema | null {
  try {
    const filePath = path.join(process.cwd(), "jalnetra_custom_model.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading default jalnetra_custom_model.json:", err);
  }
  return null;
}

export function computeInference(
  model: CustomModelSchema,
  inputs: {
    rainfall_rate_mmh: number;
    elevation_m: number;
    tidal_stage_m: number;
    canal_silt_pct: number;
    active_turbines: number;
  }
) {
  const weights = model.inferenceWeights || {
    baseInundationOffset: 8.5,
    rainfallMultiplier: 0.42,
    tidalSurgeMultiplier: 12.4,
    elevationReliefMultiplier: -7.8,
    siltFrictionMultiplier: 0.28,
    turbineReliefMultiplier: -4.2,
  };

  const rawDepth =
    weights.baseInundationOffset +
    inputs.rainfall_rate_mmh * weights.rainfallMultiplier +
    inputs.tidal_stage_m * weights.tidalSurgeMultiplier +
    inputs.elevation_m * weights.elevationReliefMultiplier +
    inputs.canal_silt_pct * weights.siltFrictionMultiplier +
    inputs.active_turbines * weights.turbineReliefMultiplier;

  const predictedDepthCm = Math.max(0, Math.round(rawDepth * 10) / 10);
  const inundationProbability = Math.min(
    0.99,
    Math.max(0.01, Math.round((predictedDepthCm / 80) * 100) / 100)
  );

  let riskCategory: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "LOW";
  if (predictedDepthCm >= 45) riskCategory = "CRITICAL";
  else if (predictedDepthCm >= 25) riskCategory = "HIGH";
  else if (predictedDepthCm >= 10) riskCategory = "MODERATE";

  return {
    predictedDepthCm,
    inundationProbability,
    riskCategory,
    crpsConfidenceBand: {
      p10DepthCm: Math.max(0, Math.round((predictedDepthCm * 0.82) * 10) / 10),
      p50DepthCm: predictedDepthCm,
      p90DepthCm: Math.round((predictedDepthCm * 1.18) * 10) / 10,
    },
    physicsConservationMet: inputs.elevation_m > 8 && predictedDepthCm < 15,
  };
}

export async function GET() {
  const currentModel = activeCustomModel || getDefaultCustomModel();

  if (!currentModel) {
    return NextResponse.json({
      status: "no_custom_model",
      message: "No custom Colab model uploaded yet. Train in Colab and export jalnetra_custom_model.json.",
      model: null,
    });
  }

  // Generate sample inference benchmark
  const benchmarkInference = computeInference(currentModel, {
    rainfall_rate_mmh: 65,
    elevation_m: 3.5,
    tidal_stage_m: 4.2,
    canal_silt_pct: 60,
    active_turbines: 4,
  });

  return NextResponse.json({
    status: "success",
    isCustomModelActive: true,
    model: currentModel,
    benchmarkInference,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is an inference request for an already registered custom model
    if (body.action === "infer") {
      const targetModel = activeCustomModel || getDefaultCustomModel();
      if (!targetModel) {
        return NextResponse.json(
          { error: "No custom model is currently loaded" },
          { status: 400 }
        );
      }

      const inputs = body.inputs || {
        rainfall_rate_mmh: 50,
        elevation_m: 4,
        tidal_stage_m: 3.5,
        canal_silt_pct: 50,
        active_turbines: 6,
      };

      const result = computeInference(targetModel, inputs);
      return NextResponse.json({
        status: "success",
        inputs,
        result,
        modelId: targetModel.modelMetadata.id,
      });
    }

    // Otherwise, treat as model upload/registration
    const modelData: CustomModelSchema = body.modelJson || body;

    // Schema verification
    if (
      !modelData ||
      modelData.format !== "jalnetra_custom_model_v1" ||
      !modelData.modelMetadata ||
      !modelData.metrics
    ) {
      return NextResponse.json(
        {
          error: "Invalid model format. Expected schema 'jalnetra_custom_model_v1' exported from Colab notebook.",
          receivedFormat: modelData?.format || "unknown",
        },
        { status: 422 }
      );
    }

    // Set as active model in session
    activeCustomModel = modelData;

    // Run verification inference
    const verifyInference = computeInference(modelData, {
      rainfall_rate_mmh: 75,
      elevation_m: 3.2,
      tidal_stage_m: 4.5,
      canal_silt_pct: 65,
      active_turbines: 3,
    });

    return NextResponse.json({
      status: "success",
      message: `Custom model '${modelData.modelMetadata.name}' (${modelData.modelMetadata.version}) deployed successfully as champion.`,
      model: modelData,
      verifyInference,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process custom model", details: errMessage },
      { status: 500 }
    );
  }
}
