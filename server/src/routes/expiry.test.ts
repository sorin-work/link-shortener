import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { clicks, links } from '../db/schema.js';
import { call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

async function ctx() {
  const base = setup();
  const cookie = await registerUser(base.app);
  return { ...base, cookie };
}

describe('link expiry', () => {
  it('stores an expiry given as a timestamp', async () => {
    const { app, cookie } = await ctx();
    const res = await call(app, 'POST', '/api/links', {
      cookie,
      json: { url: 'https://example.com', expiresAt: '2099-06-01T12:00:00Z' },
    });
    expect(res.status).toBe(201);
    const { link } = await readJson(res);
    expect(link.expiresAt).toBe('2099-06-01T12:00:00.000Z');
    expect(link.expired).toBe(false);
  });

  it('accepts a plain date from a date picker', async () => {
    const { app, cookie } = await ctx();
    const res = await call(app, 'POST', '/api/links', {
      cookie,
      json: { url: 'https://example.com', expiresAt: '2099-12-31' },
    });
    expect((await readJson(res)).link.expiresAt).toMatch(/^2099-12-31/);
  });

  it('rejects past and invalid dates', async () => {
    const { app, cookie } = await ctx();
    for (const expiresAt of ['2020-01-01', 'next tuesday']) {
      const res = await call(app, 'POST', '/api/links', {
        cookie,
        json: { url: 'https://example.com', expiresAt },
      });
      expect(res.status).toBe(400);
      expect((await readJson(res)).error.details[0].path).toBe('expiresAt');
    }
  });

  it('can be removed again', async () => {
    const { app, cookie } = await ctx();
    const { link } = await createLink(app, cookie, {
      url: 'https://example.com',
      expiresAt: '2099-01-01T00:00:00Z',
    });
    const res = await call(app, 'PATCH', `/api/links/${link.id}`, {
      cookie,
      json: { expiresAt: null },
    });
    expect((await readJson(res)).link.expiresAt).toBeNull();
  });

  it('serves a 410 once the link has expired and stops counting clicks', async () => {
    const { app, db, cookie } = await ctx();
    const { link } = await createLink(app, cookie, {
      url: 'https://example.com',
      slug: 'old-promo',
    });
    db.update(links)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(links.id, link.id))
      .run();
    const res = await call(app, 'GET', '/old-promo');
    expect(res.status).toBe(410);
    expect(await res.text()).toContain('expired');
    expect(db.select().from(clicks).all()).toHaveLength(0);
  });
});
