import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: object): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin") return null;

    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("shield_auth")?.value;
  
  if (!token) return null;

  return verifySessionToken(token);
}
