import { NextRequest, NextResponse } from "next/server";
import {
  authenticateOperator,
  createEmergencyBypassSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  ClearanceLevel,
} from "@/lib/security/auth";
import { sanitizeString } from "@/lib/security/sanitize";

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

    const body = await request.json();
    const isEmergency = Boolean(body.emergencyBypass);

    // 1. Emergency Disaster Protocol Fast-Bypass
    if (isEmergency) {
      const { payload, token } = createEmergencyBypassSession(ip);
      const response = NextResponse.json({
        status: "success",
        emergencyMode: true,
        message: "NDRF Emergency Disaster Protocol override granted.",
        session: {
          callSign: payload.callSign,
          clearance: payload.clearance,
          department: payload.department,
          expiresAt: new Date(payload.expiresAt).toISOString(),
        },
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600, // 1 hour for emergency
      });

      return response;
    }

    // 2. Standard Operator Authentication
    const callSign = sanitizeString(body.callSign, 64);
    const passcode = typeof body.passcode === "string" ? body.passcode : "";
    const clearance = (body.clearance as ClearanceLevel) || "lvl2";

    if (!callSign || !passcode) {
      return NextResponse.json(
        { error: "Operator Call Sign and Cryptographic Passcode are required." },
        { status: 400 }
      );
    }

    const authResult = authenticateOperator(callSign, passcode, clearance, ip);

    if (!authResult.success || !authResult.payload || !authResult.token) {
      const status = authResult.lockoutActive ? 423 : 401; // 423 Locked
      return NextResponse.json(
        {
          error: authResult.error || "Authentication failed.",
          lockoutActive: authResult.lockoutActive,
          remainingLockoutSec: authResult.remainingLockoutSec,
        },
        { status }
      );
    }

    // 3. Successful authentication - issue secure session cookie
    const response = NextResponse.json({
      status: "success",
      message: `Authentication successful. Clearance ${authResult.payload.clearance.toUpperCase()} granted.`,
      session: {
        callSign: authResult.payload.callSign,
        clearance: authResult.payload.clearance,
        rank: authResult.payload.rank,
        department: authResult.payload.department,
        expiresAt: new Date(authResult.payload.expiresAt).toISOString(),
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: authResult.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Malformed authentication request", details: String(error) },
      { status: 400 }
    );
  }
}
