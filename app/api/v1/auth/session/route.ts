import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  CLEARANCE_HIERARCHY,
} from "@/lib/security/auth";

export async function GET(request: NextRequest) {
  // Check cookie first, fallback to Authorization header
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      session: null,
    });
  }

  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      session: null,
      message: "Session token invalid or expired.",
    });
  }

  const clearanceMeta = CLEARANCE_HIERARCHY[session.clearance];

  return NextResponse.json({
    authenticated: true,
    session: {
      callSign: session.callSign,
      clearance: session.clearance,
      clearanceName: clearanceMeta.name,
      badge: clearanceMeta.badge,
      rank: session.rank,
      department: session.department,
      isEmergencyBypass: Boolean(session.isEmergencyBypass),
      expiresAt: new Date(session.expiresAt).toISOString(),
    },
  });
}
