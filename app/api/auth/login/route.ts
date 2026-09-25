import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.email === process.env.ADMIN_EMAIL && body.password === process.env.ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("shield_auth", process.env.AUTH_SECRET as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
