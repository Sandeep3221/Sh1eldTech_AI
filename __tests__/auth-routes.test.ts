import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { verifySessionToken } from "../app/lib/auth";

const setCookie = vi.fn();
const getCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: setCookie,
    get: getCookie,
  })),
}));

vi.mock("../app/lib/db", () => ({
  connectToDatabase: vi.fn(),
}));

import { POST as login } from "../app/api/auth/login/route";
import { POST as logout } from "../app/api/auth/logout/route";
import { GET as clients } from "../app/api/clients/route";

const password = "correct-password";
const passwordHash = await bcrypt.hash(password, 4);

function request(body: unknown, ip = "198.51.100.1") {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("Authentication routes", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD_HASH = passwordHash;
    process.env.JWT_SECRET = "test-jwt-secret-that-is-long-enough";
    process.env.NODE_ENV = "test";
    setCookie.mockClear();
    getCookie.mockReset();
  });

  it("logs in with bcrypt credentials and sets the protected cookie", async () => {
    const response = await login(request({ email: "admin@example.com", password }, "198.51.100.10"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(setCookie).toHaveBeenCalledWith("shield_auth", expect.any(String), {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    const token = setCookie.mock.calls[0][1] as string;
    const claims = await verifySessionToken(token);
    expect(claims?.email).toBe("admin@example.com");
    expect((claims?.exp as number) - (claims?.iat as number)).toBe(12 * 60 * 60);
  });

  it("sets Secure on the cookie in production", async () => {
    process.env.NODE_ENV = "production";

    const response = await login(request({ email: "admin@example.com", password }, "198.51.100.13"));

    expect(response.status).toBe(200);
    expect(setCookie.mock.calls[0][2]).toMatchObject({ secure: true, maxAge: 60 * 60 * 12 });
  });

  it("uses one generic response for invalid credentials and malformed bodies", async () => {
    const invalidEmail = await login(request({ email: "wrong@example.com", password }, "198.51.100.11"));
    const invalidPassword = await login(request({ email: "admin@example.com", password: "wrong" }, "198.51.100.12"));
    const malformed = await login(new Request("http://localhost/api/auth/login", { method: "POST", body: "not-json" }));

    expect(invalidEmail.status).toBe(401);
    expect(await invalidEmail.json()).toEqual({ error: "Invalid credentials" });
    expect(invalidPassword.status).toBe(401);
    expect(await invalidPassword.json()).toEqual({ error: "Invalid credentials" });
    expect(malformed.status).toBe(401);
    expect(await malformed.json()).toEqual({ error: "Invalid credentials" });
  });

  it("rate limits login attempts by IP", async () => {
    const ip = "198.51.100.20";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await login(request({ email: "wrong@example.com", password: "wrong" }, ip))).status).toBe(401);
    }

    const limited = await login(request({ email: "admin@example.com", password }, ip));
    expect(limited.status).toBe(429);
  });

  it("clears shield_auth on logout", async () => {
    const response = await logout();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(setCookie).toHaveBeenCalledWith("shield_auth", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  });

  it("rejects direct access to an admin handler without proxy protection", async () => {
    const response = await clients();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});
