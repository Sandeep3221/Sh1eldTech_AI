import { beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signSessionToken, verifySessionToken } from "../app/lib/auth";

const testSecret = "test-jwt-secret-that-is-long-enough";

async function createToken(
  payload: Record<string, unknown>,
  expiration: number | string = "7d"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiration)
    .sign(new TextEncoder().encode(testSecret));
}

describe("Auth Helpers", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
  });

  it("signs and verifies an admin JWT with the required claims", async () => {
    const token = await signSessionToken({ email: "admin@shieldtech.ai", role: "admin" });
    const verified = await verifySessionToken(token);

    expect(token.split(".")).toHaveLength(3);
    expect(verified).toMatchObject({
      email: "admin@shieldtech.ai",
      role: "admin",
    });
    expect(verified?.exp).toEqual(expect.any(Number));
  });

  it("rejects a tampered JWT", async () => {
    const token = await signSessionToken({ email: "admin@shieldtech.ai", role: "admin" });
    const [header, , signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ role: "admin", email: "attacker@example.com" })).toString("base64url");

    expect(await verifySessionToken(`${header}.${tamperedPayload}.${signature}`)).toBeNull();
  });

  it("rejects malformed and expired JWTs", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();

    const expired = await createToken({ role: "admin" }, Math.floor(Date.now() / 1000) - 1);
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it("rejects a JWT with the wrong role", async () => {
    const wrongRole = await createToken({ role: "user" });

    expect(await verifySessionToken(wrongRole)).toBeNull();
  });

  it("fails closed when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(signSessionToken({ email: "admin@shieldtech.ai" })).rejects.toThrow("JWT_SECRET is not configured");
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});
