import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimit.js';

describe('createRateLimiter', () => {
  it('allows up to max hits per window', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    const results = [1, 2, 3, 4].map(() => limiter.hit('k', 1_000).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it('starts a new window after it expires', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.hit('k', 0).allowed).toBe(true);
    expect(limiter.hit('k', 59_999)).toEqual({ allowed: false, retryAfter: 1 });
    expect(limiter.hit('k', 60_000).allowed).toBe(true);
  });

  it('tracks keys separately and can reset one', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    limiter.hit('a', 0);
    expect(limiter.hit('b', 0).allowed).toBe(true);
    limiter.reset('a');
    expect(limiter.hit('a', 0).allowed).toBe(true);
  });
});
