import { describe, expect, it } from 'vitest';
import { clicks, links, users } from './db/schema.js';
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

  it('generates clicks spread over the last months', async () => {
    const now = new Date('2026-03-01T12:00:00Z');
    const { db } = setup();
    await seedDemo(db, now);
    const rows = db.select().from(clicks).all();
    expect(rows.length).toBeGreaterThan(500);
    expect(rows.every((row) => row.createdAt <= now)).toBe(true);
    const days = new Set(rows.map((row) => row.createdAt.toISOString().slice(0, 10)));
    expect(days.size).toBeGreaterThan(60);
  });

  it('includes links for the optional features', async () => {
    const { db } = setup();
    await seedDemo(db);
    const rows = db.select().from(links).all();
    expect(rows.some((l) => l.expiresAt && l.expiresAt < new Date())).toBe(true);
    expect(rows.some((l) => l.maxClicks !== null)).toBe(true);
    expect(rows.some((l) => l.passwordHash)).toBe(true);
    expect(rows.some((l) => l.paused)).toBe(true);
    expect(rows.filter((l) => l.tags.length > 0).length).toBeGreaterThan(5);
  });

  it('runs only once', async () => {
    const { db } = setup();
    await seedDemo(db);
    expect(await seedDemo(db)).toBe(false);
    expect(db.select().from(users).all()).toHaveLength(1);
  });
});
