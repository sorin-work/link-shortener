import { describe, expect, it } from 'vitest';
import { sessions, users } from '../db/schema.js';
import { setup } from '../test/helpers.js';
import { createSession, findSessionUser, pruneExpiredSessions } from './sessions.js';

describe('pruneExpiredSessions', () => {
  it('deletes only expired sessions', () => {
    const { db } = setup();
    const user = db
      .insert(users)
      .values({ email: 'a@example.com', name: 'A', passwordHash: 'x' })
      .returning()
      .get();
    const live = createSession(db, user.id, 30);
    db.insert(sessions)
      .values({ id: 'old', userId: user.id, expiresAt: new Date(Date.now() - 1000) })
      .run();

    expect(pruneExpiredSessions(db)).toBe(1);
    expect(db.select().from(sessions).all()).toHaveLength(1);
    expect(findSessionUser(db, live.token)?.id).toBe(user.id);
  });
});
