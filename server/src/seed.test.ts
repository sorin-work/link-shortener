import { describe, expect, it } from 'vitest';
import { links, users } from './db/schema.js';
import { DEMO_EMAIL, DEMO_PASSWORD, seedDemo } from './seed.js';
import { call, setup } from './test/helpers.js';

describe('seedDemo', () => {
  it('creates a demo user that can sign in', async () => {
    const { app, db } = setup();
    expect(await seedDemo(db)).toBe(true);
    const res = await call(app, 'POST', '/api/auth/login', {
      json: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    expect(res.status).toBe(200);
    expect(db.select().from(links).all().length).toBeGreaterThan(5);
  });

  it('runs only once', async () => {
    const { db } = setup();
    await seedDemo(db);
    expect(await seedDemo(db)).toBe(false);
    expect(db.select().from(users).all()).toHaveLength(1);
  });
});
