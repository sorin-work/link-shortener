import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { links } from '../db/schema.js';
import { BROWSER_UA, call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

async function limitedLink(maxClicks: number) {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  const { link } = await createLink(ctx.app, cookie, {
    url: 'https://example.com',
    slug: 'limited',
    maxClicks,
  });
  return { ...ctx, cookie, link };
}

describe('click limits', () => {
  it('counts redirects towards the limit', async () => {
    const { app, cookie, link } = await limitedLink(10);
    await call(app, 'GET', '/limited');
    await call(app, 'GET', '/limited');
    const body = await readJson(await call(app, 'GET', `/api/links/${link.id}`, { cookie }));
    expect(body.link).toMatchObject({ maxClicks: 10, clickCount: 2, status: 'active' });
  });

  it('answers 410 when the counter is past the limit', async () => {
    const { app, db, link } = await limitedLink(3);
    db.update(links).set({ clickCount: 7 }).where(eq(links.id, link.id)).run();
    const res = await call(app, 'GET', '/limited');
    expect(res.status).toBe(410);
    expect(await res.text()).toContain('click limit');
  });

  it('allows exactly maxClicks redirects', async () => {
    const { app, cookie, link } = await limitedLink(2);
    const visit = () => call(app, 'GET', '/limited', { headers: { 'user-agent': BROWSER_UA } });
    expect((await visit()).status).toBe(302);
    expect((await visit()).status).toBe(302);
    expect((await visit()).status).toBe(410);
    const body = await readJson(await call(app, 'GET', `/api/links/${link.id}`, { cookie }));
    expect(body.link).toMatchObject({ clickCount: 2, status: 'limit_reached' });
  });

  it('can raise or remove the limit', async () => {
    const { app, cookie, link } = await limitedLink(3);
    const res = await call(app, 'PATCH', `/api/links/${link.id}`, {
      cookie,
      json: { maxClicks: null },
    });
    expect((await readJson(res)).link.maxClicks).toBeNull();
  });

  it('rejects zero and fractional limits', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    for (const maxClicks of [0, 2.5, -1]) {
      const res = await call(app, 'POST', '/api/links', {
        cookie,
        json: { url: 'https://example.com', maxClicks },
      });
      expect(res.status).toBe(400);
    }
  });
});
