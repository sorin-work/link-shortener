import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { Db } from '../db/client.js';
import { unauthorized } from '../lib/errors.js';
import { findSessionUser, SESSION_COOKIE } from '../lib/sessions.js';
import type { AppEnv } from '../types.js';

export function requireUser(db: Db) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE);
    const user = token ? findSessionUser(db, token) : null;
    if (!user) throw unauthorized();
    c.set('user', user);
    await next();
  });
}
