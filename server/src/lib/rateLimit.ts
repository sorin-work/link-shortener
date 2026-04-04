export interface RateLimitResult {
  allowed: boolean;
  /** seconds until the window resets */
  retryAfter: number;
}

export interface RateLimiter {
  hit(key: string, now?: number): RateLimitResult;
  reset(key: string): void;
}

/** Fixed-window counter kept in memory. Good enough for a single instance. */
export function createRateLimiter({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  const prune = (now: number) => {
    for (const [key, entry] of windows) if (entry.resetAt <= now) windows.delete(key);
  };

  return {
    hit(key, now = Date.now()) {
      let entry = windows.get(key);
      if (!entry || entry.resetAt <= now) {
        if (windows.size > 10_000) prune(now);
        entry = { count: 0, resetAt: now + windowMs };
        windows.set(key, entry);
      }
      entry.count++;
      return {
        allowed: entry.count <= max,
        retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    },
    reset(key) {
      windows.delete(key);
    },
  };
}
