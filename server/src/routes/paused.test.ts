import { describe, expect, it } from 'vitest';
import { clicks } from '../db/schema.js';
import { call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

describe('paused links', () => {
  it('stop redirecting until resumed', async () => {
    const { app, db } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, {
      url: 'https://example.com',
      slug: 'pausable',
    });

    const pause = await call(app, 'PATCH', `/api/links/${link.id}`, {
      cookie,
      json: { paused: true },
    });
    expect((await readJson(pause)).link.status).toBe('paused');
    const res = await call(app, 'GET', '/pausable');
    expect(res.status).toBe(410);
    expect(await res.text()).toContain('paused');
    expect(db.select().from(clicks).all()).toHaveLength(0);

    await call(app, 'PATCH', `/api/links/${link.id}`, { cookie, json: { paused: false } });
    expect((await call(app, 'GET', '/pausable')).status).toBe(302);
  });
});
