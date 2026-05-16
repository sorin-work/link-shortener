import { eq } from 'drizzle-orm';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { Db } from '../db/client.js';
import { apiKeys, users, type User } from '../db/schema.js';
import { hashApiKey } from '../lib/apiKeys.js';
import { unauthorized } from '../lib/errors.js';
import { findSessionUser, SESSION_COOKIE } from '../lib/sessions.js';
import type { AppEnv } from '../types.js';

function findApiKeyUser(db: Db, token: string): User | null {
  const row = db
    .select({ user: users, keyId: apiKeys.id })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.keyHash, hashApiKey(token)))
    .get();
  if (!row) return null;
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.keyId)).run();
  return row.user;
}

export function requireUser(db: Db, { allowApiKey = false } = {}) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const authorization = c.req.header('authorization');
    let user: User | null;
    if (allowApiKey && authorization?.startsWith('Bearer ')) {
      user = findApiKeyUser(db, authorization.slice('Bearer '.length).trim());
      if (!user) throw unauthorized('Invalid API key');
    } else {
      const token = getCookie(c, SESSION_COOKIE);
      user = token ? findSessionUser(db, token) : null;
    }
    if (!user) throw unauthorized();
    c.set('user', user);
    await next();
  });
}
