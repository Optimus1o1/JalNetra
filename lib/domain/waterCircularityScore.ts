import { WaterCircularityScore } from "./types";

export interface CircularityScoringFactors {
  harvestRatio: number; // harvested water / total rainfall volume (0.0 - 1.0)
  reuseDemandFulfillmentRatio: number; // reused water / daily demand (0.0 - 1.0)
  rechargeScore: number; // 0 - 100
  runoffAvoidanceRatio: number; // avoided runoff / unmitigated runoff (0.0 - 1.0)
}

/**
 * Calculates the JALNETRA Water Circularity Score (0 - 100)
 * Evaluates how effectively precipitation is captured, stored, reused, and recharged
 * instead of becoming uncontrolled street ponding and canal backflow.
 */
export function calculateWaterCircularityScore(
  factors: CircularityScoringFactors
): WaterCircularityScore {
  const weights = {
    capture: 0.30,
    reuse: 0.25,
    recharge: 0.20,
    runoffRelief: 0.25,
  };

  const captureSubScore = Math.min(100, Math.round(factors.harvestRatio * 100));
  const reuseSubScore = Math.min(100, Math.round(factors.reuseDemandFulfillmentRatio * 100));
  const rechargeSubScore = Math.min(100, Math.max(0, factors.rechargeScore));
  const reliefSubScore = Math.min(100, Math.round(factors.runoffAvoidanceRatio * 100));

  const composite = Math.round(
    captureSubScore * weights.capture +
      reuseSubScore * weights.reuse +
      rechargeSubScore * weights.recharge +
      reliefSubScore * weights.runoffRelief
  );

  let rating: WaterCircularityScore["rating"] = "DEVELOPING";
  if (composite >= 80) rating = "OPTIMAL";
  else if (composite >= 60) rating = "BALANCED";
  else if (composite < 35) rating = "CRITICAL_DEFICIT";

  const explanations = [
    {
      name: "Rainwater Interception & Capture",
      impact: Math.round(captureSubScore * weights.capture),
      direction: captureSubScore >= 50 ? ("positive" as const) : ("negative" as const),
      narrative: `Capturing ${captureSubScore}% of gross rainfall incident on catchment footprint.`,
    },
    {
      name: "Non-Potable Demand Offset",
      impact: Math.round(reuseSubScore * weights.reuse),
      direction: reuseSubScore >= 50 ? ("positive" as const) : ("negative" as const),
      narrative: `Displacing ${reuseSubScore}% of municipal treated water with harvested precipitation.`,
    },
    {
      name: "Aquifer Replenishment & Infiltration",
      impact: Math.round(rechargeSubScore * weights.recharge),
      direction: rechargeSubScore >= 50 ? ("positive" as const) : ("negative" as const),
      narrative: `Recharge suitability rated at ${rechargeSubScore}/100 based on soil hydraulic conductivity.`,
    },
    {
      name: "Drainage Canal Stress Avoidance",
      impact: Math.round(reliefSubScore * weights.runoffRelief),
      direction: reliefSubScore >= 50 ? ("positive" as const) : ("negative" as const),
      narrative: `Eliminating ${reliefSubScore}% of unmitigated storm runoff from municipal drainage canals.`,
    },
  ];

  return {
    score: composite,
    compositeScore: composite,
    rating,
    dimensions: {
      capturePotential: captureSubScore,
      reuseFulfillment: reuseSubScore,
      rechargeEffectiveness: rechargeSubScore,
      floodRunoffRelief: reliefSubScore,
    },
    factorWeights: weights,
    explanations,
    provenance: "SIMULATED",
  };
}
