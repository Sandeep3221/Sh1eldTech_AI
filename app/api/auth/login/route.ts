import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSessionToken } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.email === process.env.ADMIN_EMAIL && body.password === process.env.ADMIN_PASSWORD) {
      const token = await signSessionToken({ role: "admin", email: body.email });
      const cookieStore = await cookies();
      cookieStore.set("shield_auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
