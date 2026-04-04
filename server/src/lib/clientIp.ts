import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';

/**
 * The visitor's address. X-Forwarded-For is only trusted when the app runs
 * behind a proxy (TRUST_PROXY), otherwise anyone could pick their own IP.
 */
export function clientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    // app.request() in tests has no socket
    return 'unknown';
  }
}
