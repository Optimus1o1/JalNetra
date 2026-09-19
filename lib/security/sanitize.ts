// JalNetra Global — Input Sanitization & Anomaly Defense

/**
 * Strips HTML tags, script vectors, and potentially dangerous injection characters
 */
export function sanitizeString(
  input: unknown,
  maxLength: number = 255,
  defaultValue: string = ""
): string {
  if (typeof input !== "string") {
    return defaultValue;
  }

  // Remove null bytes and control characters
  let clean = input.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip script, iframe, style, and HTML tags
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<[^>]+>/g, "");

  // Prevent prototype pollution keywords if parsed
  clean = clean.replace(/__proto__|constructor|prototype/gi, "");

  // Trim and limit length
  clean = clean.trim().substring(0, maxLength);

  return clean;
}

/**
 * Validates and clamps a number within safe physical bounds
 */
export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates and sanitizes simulation scenario inputs
 */
export interface SanitizedSimulationInputs {
  rainfallMultiplier: number;
  tidalSurgeAnomalyM: number;
  canalSiltPct: number;
  activeEmergencyPumps: number;
  sluiceGateOverride: boolean;
  scenarioName: string;
}

export function sanitizeSimulationInputs(raw: Record<string, unknown>): SanitizedSimulationInputs {
  return {
    rainfallMultiplier: clampNumber(raw.rainfallMultiplier, 0.1, 10.0, 1.0),
    tidalSurgeAnomalyM: clampNumber(raw.tidalSurgeAnomalyM, -2.0, 6.0, 0.0),
    canalSiltPct: clampNumber(raw.canalSiltPct, 0, 100, 50),
    activeEmergencyPumps: Math.round(clampNumber(raw.activeEmergencyPumps, 0, 20, 0)),
    sluiceGateOverride: Boolean(raw.sluiceGateOverride),
    scenarioName: sanitizeString(raw.scenarioName, 100, "Custom Emergency Scenario"),
  };
}
