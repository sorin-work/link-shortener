import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { sessions, users, type User } from '../db/schema.js';

export const SESSION_COOKIE = 'sid';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function createSession(db: Db, userId: number, ttlDays: number) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);
  db.insert(sessions)
    .values({ id: hashToken(token), userId, expiresAt })
    .run();
  return { token, expiresAt };
}

export function findSessionUser(db: Db, token: string): User | null {
  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .get();
  return row?.user ?? null;
}

export function deleteSession(db: Db, token: string) {
  db.delete(sessions)
    .where(eq(sessions.id, hashToken(token)))
    .run();
}
