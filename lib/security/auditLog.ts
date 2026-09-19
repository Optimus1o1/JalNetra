// JalNetra Global — Structured Security Audit Telemetry Logger

export type AuditEventType =
  | "AUTH_SUCCESS"
  | "AUTH_FAILURE"
  | "AUTH_LOCKOUT"
  | "RATE_LIMIT_EXCEEDED"
  | "ALERT_ACKNOWLEDGED"
  | "ADMIN_SEED_EXECUTE"
  | "EMERGENCY_BYPASS"
  | "UNAUTHORIZED_ACCESS";

export interface AuditEntry {
  id: string;
  timestamp: string;
  type: AuditEventType;
  severity: "INFO" | "WARN" | "CRITICAL";
  actor: string;
  ip: string;
  details: string;
}

// In-memory ring buffer for the 50 most recent security events
const MAX_AUDIT_ENTRIES = 50;
const auditLogBuffer: AuditEntry[] = [
  {
    id: "aud-boot-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: "AUTH_SUCCESS",
    severity: "INFO",
    actor: "SYSTEM_INIT",
    ip: "127.0.0.1",
    details: "JalNetra Core Security Subsystem initialized. FIPS-140-3 baseline verified.",
  },
  {
    id: "aud-boot-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    type: "AUTH_SUCCESS",
    severity: "INFO",
    actor: "KMC-HYD-40892",
    ip: "10.14.88.22",
    details: "Clearance Level 2 verified. Session handshake established with Outram Ghat telemetry downlink.",
  },
];

export function logAuditEvent(
  type: AuditEventType,
  actor: string,
  ip: string,
  details: string,
  severity: "INFO" | "WARN" | "CRITICAL" = "INFO"
): AuditEntry {
  const entry: AuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    type,
    severity,
    actor,
    ip,
    details,
  };

  auditLogBuffer.unshift(entry);

  if (auditLogBuffer.length > MAX_AUDIT_ENTRIES) {
    auditLogBuffer.pop();
  }

  // Console output formatted for operational logs
  const logPrefix = `[JALNETRA SEC AUDIT][${entry.severity}][${entry.type}]`;
  if (severity === "CRITICAL") {
    console.error(`${logPrefix} ${actor} (${ip}): ${details}`);
  } else if (severity === "WARN") {
    console.warn(`${logPrefix} ${actor} (${ip}): ${details}`);
  } else {
    console.log(`${logPrefix} ${actor} (${ip}): ${details}`);
  }

  return entry;
}

export function getRecentAuditLogs(limit: number = 20): AuditEntry[] {
  return auditLogBuffer.slice(0, Math.min(limit, MAX_AUDIT_ENTRIES));
}
