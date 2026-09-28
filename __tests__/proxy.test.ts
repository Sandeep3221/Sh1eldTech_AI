import { describe, it, expect, vi } from 'vitest';
import { proxy } from '../proxy';
import { NextRequest } from 'next/server';

vi.mock('../app/lib/auth', () => ({
  verifySessionToken: vi.fn(async (token) => {
    if (token === 'valid_token') return { role: 'admin' };
    return null;
  })
}));

describe('Proxy / Middleware', () => {
  it('should redirect unauthenticated users to login from /dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard/clients');
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('should allow authenticated users in /dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard/clients');
    req.cookies.set('shield_auth', 'valid_token');
    const res = await proxy(req);
    // Since we mock NextResponse.next() internally it returns a 200 equivalent without redirect headers
    expect(res.status).toBe(200); 
  });

  it('should return 401 for protected API routes without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/clients');
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it('should allow public API routes without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat');
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it('should allow all explicitly public auth and widget APIs without auth', async () => {
    for (const path of ['/api/auth/login', '/api/auth/logout', '/api/itinerary', '/api/widget-config']) {
      const req = new NextRequest(`http://localhost:3000${path}`);
      const res = await proxy(req);
      expect(res.status).toBe(200);
    }
  });

  it('should protect unknown API routes by default', async () => {
    const req = new NextRequest('http://localhost:3000/api/future-admin-endpoint');
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it('should allow widget-config without auth', async () => {
    const req = new NextRequest('http://localhost:3000/api/widget-config');
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });
});
