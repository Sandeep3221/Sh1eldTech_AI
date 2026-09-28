export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count += 1;
    return true;
  }
}

export const chatRateLimiter = new RateLimiter(30, 60 * 1000); // 30 req / min
export const itineraryRateLimiter = new RateLimiter(5, 10 * 60 * 1000); // 5 req / 10 min
