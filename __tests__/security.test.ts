import { describe, it, expect, beforeEach } from 'vitest';
import { validateAllowedDomain } from '../app/lib/security';
import { NextRequest } from 'next/server';

describe('Security: validateAllowedDomain', () => {
  it('should allow if domains array is empty', () => {
    const req = new NextRequest('http://localhost:3000');
    expect(validateAllowedDomain(req, [])).toBe(true);
  });

  it('should allow localhost development domains', () => {
    const req = new NextRequest('http://localhost:3000', {
      headers: new Headers({ 'origin': 'http://localhost:4000' })
    });
    expect(validateAllowedDomain(req, ['example.com'])).toBe(true);
  });

  it('should allow if origin matches allowed domains', () => {
    const req = new NextRequest('http://localhost:3000', {
      headers: new Headers({ 'origin': 'https://example.com' })
    });
    expect(validateAllowedDomain(req, ['example.com', 'other.com'])).toBe(true);
  });

  it('should strip www. from origin for comparison', () => {
    const req = new NextRequest('http://localhost:3000', {
      headers: new Headers({ 'origin': 'https://www.example.com' })
    });
    expect(validateAllowedDomain(req, ['example.com'])).toBe(true);
  });

  it('should reject if origin does not match', () => {
    const req = new NextRequest('http://localhost:3000', {
      headers: new Headers({ 'origin': 'https://malicious.com' })
    });
    expect(validateAllowedDomain(req, ['example.com'])).toBe(false);
  });

  it('should check referer if origin is missing', () => {
    const req = new NextRequest('http://localhost:3000', {
      headers: new Headers({ 'referer': 'https://example.com/some/path' })
    });
    expect(validateAllowedDomain(req, ['example.com'])).toBe(true);
  });
});
