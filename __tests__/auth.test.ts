import { beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signSessionToken, verifySessionToken } from "../app/lib/auth";

const testSecret = "test-jwt-secret-that-is-long-enough";

async function createToken(
  payload: Record<string, unknown>,
  claims: { issuer?: string; audience?: string; expiration?: number } = {}
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(claims.issuer ?? "sh1eldtech-ai")
    .setAudience(claims.audience ?? "sh1eldtech-admin")
    .setExpirationTime(claims.expiration ?? "12h")
    .sign(new TextEncoder().encode(testSecret));
}

describe("Auth Helpers", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
  });

  it("signs and verifies an admin JWT with the required claims", async () => {
    const token = await signSessionToken({ email: "admin@shieldtech.ai" });
    const verified = await verifySessionToken(token);

    expect(token.split(".")).toHaveLength(3);
    expect(verified).toMatchObject({
      email: "admin@shieldtech.ai",
      role: "admin",
      iss: "sh1eldtech-ai",
      aud: "sh1eldtech-admin",
    });
    expect(verified?.iat).toEqual(expect.any(Number));
    expect(verified?.exp).toEqual(expect.any(Number));
  });

  it("rejects a tampered JWT", async () => {
    const token = await signSessionToken({ email: "admin@shieldtech.ai" });
    const [header, , signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ role: "admin", email: "attacker@example.com" })).toString("base64url");

    expect(await verifySessionToken(`${header}.${tamperedPayload}.${signature}`)).toBeNull();
  });

  it("rejects malformed and expired JWTs", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();

    const expired = await createToken({ role: "admin" }, { expiration: Math.floor(Date.now() / 1000) - 1 });
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it("rejects wrong issuer, audience, and role", async () => {
    const wrongIssuer = await createToken({ role: "admin" }, { issuer: "wrong-issuer" });
    const wrongAudience = await createToken({ role: "admin" }, { audience: "wrong-audience" });
    const wrongRole = await createToken({ role: "user" });

    expect(await verifySessionToken(wrongIssuer)).toBeNull();
    expect(await verifySessionToken(wrongAudience)).toBeNull();
    expect(await verifySessionToken(wrongRole)).toBeNull();
  });

  it("fails closed when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(signSessionToken({ email: "admin@shieldtech.ai" })).rejects.toThrow("JWT_SECRET is not configured");
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});
