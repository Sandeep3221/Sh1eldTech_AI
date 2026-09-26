import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, chatRateLimiter, itineraryRateLimiter } from '../app/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow requests under the limit', () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.check('client_1')).toBe(true);
    expect(limiter.check('client_1')).toBe(true);
    expect(limiter.check('client_1')).toBe(true);
  });

  it('should reject requests over the limit', () => {
    const limiter = new RateLimiter(3, 60000);
    limiter.check('client_1');
    limiter.check('client_1');
    limiter.check('client_1');
    expect(limiter.check('client_1')).toBe(false);
  });

  it('should reset after windowMs passes', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.check('client_1');
    limiter.check('client_1');
    expect(limiter.check('client_1')).toBe(false);

    vi.advanceTimersByTime(1100);
    expect(limiter.check('client_1')).toBe(true);
  });

  it('should isolate keys', () => {
    const limiter = new RateLimiter(1, 60000);
    expect(limiter.check('client_1')).toBe(true);
    expect(limiter.check('client_1')).toBe(false);
    
    expect(limiter.check('client_2')).toBe(true);
  });
});
