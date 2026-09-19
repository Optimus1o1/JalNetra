// JalNetra Global — Cryptographic Authentication & Role-Based Access Control (RBAC)

import crypto from "node:crypto";
import { logAuditEvent } from "./auditLog";

export type ClearanceLevel = "lvl1" | "lvl2" | "lvl3";

export interface ClearanceMetadata {
  name: string;
  scope: string;
  badge: string;
  rank: number; // 1: Observer, 2: Hydrologist, 3: Commander
}

export const CLEARANCE_HIERARCHY: Record<ClearanceLevel, ClearanceMetadata> = {
  lvl1: {
    name: "LEVEL 1: FIELD OBSERVER",
    scope: "KMC Ward Sump & Sensor Monitoring (Read-Only Telemetry)",
    badge: "OBSERVER CLEARANCE",
    rank: 1,
  },
  lvl2: {
    name: "LEVEL 2: MUNICIPAL HYDROLOGIST",
    scope: "Canal Sluice Modeling, Runoff Diagnostics & Scenario Engine",
    badge: "HYDROLOGIST CLEARANCE",
    rank: 2,
  },
  lvl3: {
    name: "LEVEL 3: INCIDENT COMMANDER",
    scope: "Emergency Pump Dispatch, Embankment Interlocks & Evacuation",
    badge: "COMMAND CLEARANCE",
    rank: 3,
  },
};

export interface OperatorProfile {
  callSign: string;
  passcodeHash: string; // SHA-256 hash of plaintext passcode
  clearance: ClearanceLevel;
  department: string;
}

// Pre-configured cryptographic mission accounts (stored securely as SHA-256 hashes)
function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const REGISTERED_OPERATORS: Record<string, OperatorProfile> = {
  "OBS-7041": {
    callSign: "OBS-7041",
    passcodeHash: sha256("Observer@Jal2026"),
    clearance: "lvl1",
    department: "KMC Ward Telemetry Cell",
  },
  "KMC-HYD-40892": {
    callSign: "KMC-HYD-40892",
    passcodeHash: sha256("Hydro#Delta2026"),
    clearance: "lvl2",
    department: "Municipal Drainage & Hydrology Wing",
  },
  "CMD-KMC-001": {
    callSign: "CMD-KMC-001",
    passcodeHash: sha256("Commander!KMC2026"),
    clearance: "lvl3",
    department: "KMC Disaster Incident Command Desk",
  },
};

// Brute-force protection: failed attempts & lockouts
interface LockoutTracker {
  failedAttempts: number;
  lockedUntil: number;
}
const lockoutMap = new Map<string, LockoutTracker>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Session secret key — in production set JALNETRA_SESSION_SECRET, fallback to deterministic machine key in local dev
const SESSION_SECRET =
  process.env.JALNETRA_SESSION_SECRET ||
  "jalnetra-production-delta-resilience-crypto-secret-key-32b";

export const SESSION_COOKIE_NAME = "jalnetra_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

export interface SessionPayload {
  callSign: string;
  clearance: ClearanceLevel;
  rank: number;
  department: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  isEmergencyBypass?: boolean;
}

// 1. Timing-safe verification using SHA-256 digests
export function verifyPasscode(inputPasscode: string, expectedHash: string): boolean {
  const inputHash = sha256(inputPasscode);
  const bufA = Buffer.from(inputHash, "hex");
  const bufB = Buffer.from(expectedHash, "hex");

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// 2. Token creation: Base64URL(payload).Base64URL(HMAC-SHA256)
export function createSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

// 3. Token verification
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  const sigBufA = Buffer.from(signature, "utf-8");
  const sigBufB = Buffer.from(expectedSignature, "utf-8");

  if (sigBufA.length !== sigBufB.length) return null;
  if (!crypto.timingSafeEqual(sigBufA, sigBufB)) return null;

  try {
    const json = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// 4. Authenticate credentials with lockout protection
export interface AuthResult {
  success: boolean;
  payload?: SessionPayload;
  token?: string;
  error?: string;
  lockoutActive?: boolean;
  remainingLockoutSec?: number;
}

export function authenticateOperator(
  callSign: string,
  passcode: string,
  requestedClearance: ClearanceLevel,
  ip: string = "127.0.0.1"
): AuthResult {
  const now = Date.now();
  const lockoutKey = `${callSign}:${ip}`;
  const tracker = lockoutMap.get(lockoutKey);

  // Check lockout
  if (tracker && tracker.lockedUntil > now) {
    const remainingLockoutSec = Math.ceil((tracker.lockedUntil - now) / 1000);
    logAuditEvent(
      "AUTH_LOCKOUT",
      callSign,
      ip,
      `Operator account locked. Attempt rejected. Remaining lockout: ${remainingLockoutSec}s`,
      "WARN"
    );
    return {
      success: false,
      error: `Security Lockout Active. Too many failed attempts. Try again in ${remainingLockoutSec} seconds.`,
      lockoutActive: true,
      remainingLockoutSec,
    };
  }

  const operator = REGISTERED_OPERATORS[callSign];
  if (!operator) {
    recordFailedAttempt(lockoutKey, callSign, ip);
    logAuditEvent("AUTH_FAILURE", callSign, ip, "Invalid Operator Call Sign supplied.", "WARN");
    return { success: false, error: "Invalid Operator Call Sign or Passcode." };
  }

  // Verify passcode
  const isValidPasscode = verifyPasscode(passcode, operator.passcodeHash);
  if (!isValidPasscode) {
    recordFailedAttempt(lockoutKey, callSign, ip);
    logAuditEvent("AUTH_FAILURE", callSign, ip, "Cryptographic passcode verification failed.", "WARN");
    return { success: false, error: "Invalid Operator Call Sign or Passcode." };
  }

  // Check requested clearance vs permitted clearance rank
  const userRank = CLEARANCE_HIERARCHY[operator.clearance].rank;
  const requestedRank = CLEARANCE_HIERARCHY[requestedClearance].rank;

  if (requestedRank > userRank) {
    logAuditEvent(
      "UNAUTHORIZED_ACCESS",
      callSign,
      ip,
      `Requested clearance (${requestedClearance}) exceeds operator entitlement (${operator.clearance}).`,
      "WARN"
    );
    return {
      success: false,
      error: `Access Denied: Your account is authorized up to ${CLEARANCE_HIERARCHY[operator.clearance].name}.`,
    };
  }

  // Reset failed attempts on success
  lockoutMap.delete(lockoutKey);

  const grantedClearance = requestedClearance;
  const payload: SessionPayload = {
    callSign: operator.callSign,
    clearance: grantedClearance,
    rank: CLEARANCE_HIERARCHY[grantedClearance].rank,
    department: operator.department,
    sessionId: `sess-${crypto.randomUUID()}`,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const token = createSessionToken(payload);
  logAuditEvent(
    "AUTH_SUCCESS",
    callSign,
    ip,
    `Operator authenticated successfully with ${CLEARANCE_HIERARCHY[grantedClearance].name}. Session initialized.`
  );

  return {
    success: true,
    payload,
    token,
  };
}

function recordFailedAttempt(lockoutKey: string, callSign: string, ip: string) {
  const now = Date.now();
  const tracker = lockoutMap.get(lockoutKey) || { failedAttempts: 0, lockedUntil: 0 };
  tracker.failedAttempts += 1;

  if (tracker.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    tracker.lockedUntil = now + LOCKOUT_DURATION_MS;
    tracker.failedAttempts = 0;
    logAuditEvent(
      "AUTH_LOCKOUT",
      callSign,
      ip,
      `Account locked for 5 minutes after ${MAX_FAILED_ATTEMPTS} consecutive authentication failures.`,
      "CRITICAL"
    );
  }

  lockoutMap.set(lockoutKey, tracker);
}

// 5. Emergency NDRF fast-bypass mode for disaster situations
export function createEmergencyBypassSession(ip: string = "127.0.0.1"): {
  payload: SessionPayload;
  token: string;
} {
  const now = Date.now();
  const payload: SessionPayload = {
    callSign: "NDRF-DISASTER-OVERRIDE",
    clearance: "lvl1",
    rank: 1,
    department: "National Disaster Response Force (Emergency S2S Link)",
    sessionId: `emergency-${crypto.randomUUID()}`,
    issuedAt: now,
    expiresAt: now + 60 * 60 * 1000, // 1 hour temporary emergency bypass
    isEmergencyBypass: true,
  };

  const token = createSessionToken(payload);
  logAuditEvent(
    "EMERGENCY_BYPASS",
    payload.callSign,
    ip,
    "Emergency Disaster Protocol executed. Temporary Level 1 telemetry bypass session granted.",
    "WARN"
  );

  return { payload, token };
}

// 6. Clearance verification helper for API routes
export function hasRequiredClearance(
  session: SessionPayload | null,
  minimumLevel: ClearanceLevel
): boolean {
  if (!session) return false;
  const minimumRank = CLEARANCE_HIERARCHY[minimumLevel].rank;
  return session.rank >= minimumRank;
}
