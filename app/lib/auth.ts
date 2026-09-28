import { cookies } from "next/headers";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

const JWT_ISSUER = "sh1eldtech-ai";
const JWT_AUDIENCE = "sh1eldtech-admin";
const JWT_EXPIRATION = "12h";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: object): Promise<string> {
  return new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.role !== "admin") return null;

    return payload as JWTPayload & Record<string, unknown>;
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
