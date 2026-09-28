import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { signSessionToken } from "@/app/lib/auth";
import { loginRateLimiter } from "@/app/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
    if (!loginRateLimiter.check(ip)) {
      return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
    }

    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      typeof (body as { email?: unknown }).email !== "string" ||
      typeof (body as { password?: unknown }).password !== "string" ||
      !(body as { email: string }).email ||
      !(body as { password: string }).password
    ) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { email, password } = body as { email: string; password: string };
    const adminEmail = process.env.ADMIN_EMAIL;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminEmail || !passwordHash || !process.env.JWT_SECRET) {
      console.error("Authentication configuration error: required environment variables are missing");
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    const emailMatches = email === adminEmail;
    const passwordMatches = emailMatches && await bcrypt.compare(password, passwordHash);
    if (!emailMatches || !passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signSessionToken({ email });
    const cookieStore = await cookies();
    cookieStore.set("shield_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
