import { describe, expect, it } from 'vitest';
import { clicks } from '../db/schema.js';
import { call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

const form = (password: string) => ({
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ password }).toString(),
});

async function protectedLink() {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  const { link } = await createLink(ctx.app, cookie, {
    url: 'https://example.com/secret',
    slug: 'secret',
    title: 'Team notes',
    password: 'open-sesame',
  });
  return { ...ctx, cookie, link };
}

describe('password-protected links', () => {
  it('reports protection without leaking the hash', async () => {
    const { app, cookie, link } = await protectedLink();
    const body = await readJson(await call(app, 'GET', `/api/links/${link.id}`, { cookie }));
    expect(body.link.hasPassword).toBe(true);
    expect(JSON.stringify(body)).not.toContain('scrypt');
  });

  it('shows an unlock form instead of redirecting', async () => {
    const { app, db } = await protectedLink();
    const res = await call(app, 'GET', '/secret');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<form method="post" action="/secret">');
    expect(html).toContain('Team notes');
    expect(db.select().from(clicks).all()).toHaveLength(0);
  });

  it('escapes the title on the unlock page', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    await createLink(app, cookie, {
      url: 'https://example.com',
      slug: 'xss',
      title: '<script>alert(document.cookie)</script>',
      password: 'open-sesame',
    });
    const html = await (await call(app, 'GET', '/xss')).text();
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('redirects and counts the click with the right password', async () => {
    const { app, db } = await protectedLink();
    const res = await app.request('/secret', { method: 'POST', ...form('open-sesame') });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://example.com/secret');
    expect(db.select().from(clicks).all()).toHaveLength(1);
  });

  it('shows the form again with an error for a wrong password', async () => {
    const { app } = await protectedLink();
    const res = await app.request('/secret', { method: 'POST', ...form('nope') });
    expect(res.status).toBe(401);
    expect(await res.text()).toContain('Wrong password');
  });

  it('locks out after too many wrong passwords', async () => {
    const { app } = await protectedLink();
    for (let i = 0; i < 10; i++) await app.request('/secret', { method: 'POST', ...form('nope') });
    const res = await app.request('/secret', { method: 'POST', ...form('open-sesame') });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('can remove the password', async () => {
    const { app, cookie, link } = await protectedLink();
    await call(app, 'PATCH', `/api/links/${link.id}`, { cookie, json: { password: null } });
    const res = await call(app, 'GET', '/secret');
    expect(res.status).toBe(302);
  });

  it('rejects very short passwords', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const res = await call(app, 'POST', '/api/links', {
      cookie,
      json: { url: 'https://example.com', password: 'abc' },
    });
    expect(res.status).toBe(400);
  });
});
