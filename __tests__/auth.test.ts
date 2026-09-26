import { describe, it, expect } from 'vitest';
import { signSessionToken, verifySessionToken } from '../app/lib/auth';

describe('Auth Helpers', () => {
  it('should sign and verify a token successfully', async () => {
    const payload = { email: 'admin@shieldtech.ai' };
    const token = await signSessionToken(payload);
    
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(2); // base64Payload.base64Signature

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe('admin@shieldtech.ai');
  });

  it('should fail verification for tampered payload', async () => {
    const token = await signSessionToken({ email: 'admin@shieldtech.ai' });
    const parts = token.split('.');
    
    // Tamper the payload
    const fakePayload = btoa(JSON.stringify({ email: 'hacker@shieldtech.ai' }));
    const tamperedToken = `${fakePayload}.${parts[1]}`;

    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('should fail for completely invalid token format', async () => {
    const verified = await verifySessionToken('invalid-token-format');
    expect(verified).toBeNull();
  });
});
