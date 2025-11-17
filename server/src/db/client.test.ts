import { describe, expect, it } from 'vitest';
import { users } from './schema.js';
import { setup } from '../test/helpers.js';

describe('openDatabase', () => {
  it('applies migrations to a fresh database', () => {
    const { db } = setup();
    db.insert(users).values({ email: 'a@example.com', name: 'A', passwordHash: 'x' }).run();
    const rows = db.select().from(users).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.createdAt).toBeInstanceOf(Date);
  });

  it('enforces unique emails', () => {
    const { db } = setup();
    const row = { email: 'a@example.com', name: 'A', passwordHash: 'x' };
    db.insert(users).values(row).run();
    expect(() => db.insert(users).values(row).run()).toThrow(/UNIQUE/);
  });
});
