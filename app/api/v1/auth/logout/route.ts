import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/security/auth";
import { logAuditEvent } from "@/lib/security/auditLog";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  if (session) {
    logAuditEvent(
      "AUTH_SUCCESS",
      session.callSign,
      ip,
      `Operator logged out. Clearance ${session.clearance.toUpperCase()} session terminated.`
    );
  }

  const response = NextResponse.json({
    status: "success",
    message: "Operator session successfully terminated.",
  });

  // Clear cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
