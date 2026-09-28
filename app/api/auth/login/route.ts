import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSessionToken } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signSessionToken({ email, role: "admin" });
    const cookieStore = await cookies();
    cookieStore.set("shield_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
