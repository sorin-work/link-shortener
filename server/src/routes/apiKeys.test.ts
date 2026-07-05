import { describe, expect, it } from 'vitest';
import { call, readJson, registerUser, setup } from '../test/helpers.js';

async function withKey() {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  const res = await call(ctx.app, 'POST', '/api/keys', { cookie, json: { name: 'CI' } });
  const body = await readJson(res);
  return { ...ctx, cookie, res, key: body.key, token: body.token as string };
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

describe('api keys', () => {
  it('returns the token once and stores only a prefix', async () => {
    const { app, cookie, res, key, token } = await withKey();
    expect(res.status).toBe(201);
    expect(token).toMatch(/^lsk_[\w-]{32}$/);
    expect(token.startsWith(key.prefix)).toBe(true);
    const list = await readJson(await call(app, 'GET', '/api/keys', { cookie }));
    expect(list.keys).toHaveLength(1);
    expect(JSON.stringify(list)).not.toContain(token);
  });

  it('creates links with a bearer token', async () => {
    const { app, token } = await withKey();
    const res = await call(app, 'POST', '/api/links', {
      headers: bearer(token),
      json: { url: 'https://example.com/from-ci', slug: 'from-ci' },
    });
    expect(res.status).toBe(201);
    const list = await readJson(await call(app, 'GET', '/api/links', { headers: bearer(token) }));
    expect(list.links[0].slug).toBe('from-ci');
  });

  it('records when a key was last used', async () => {
    const { app, cookie, token } = await withKey();
    await call(app, 'GET', '/api/links', { headers: bearer(token) });
    const list = await readJson(await call(app, 'GET', '/api/keys', { cookie }));
    expect(list.keys[0].lastUsedAt).not.toBeNull();
  });

  it('rejects unknown keys', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/links', { headers: bearer('lsk_nope') });
    expect(res.status).toBe(401);
    expect((await readJson(res)).error.message).toBe('Invalid API key');
  });

  it('cannot be used to manage api keys', async () => {
    const { app, token } = await withKey();
    const res = await call(app, 'POST', '/api/keys', {
      headers: bearer(token),
      json: { name: 'x' },
    });
    expect(res.status).toBe(401);
  });

  it('marks a key as revoked', async () => {
    const { app, cookie, key } = await withKey();
    const del = await call(app, 'DELETE', `/api/keys/${key.id}`, { cookie });
    expect(del.status).toBe(204);
    const list = await readJson(await call(app, 'GET', '/api/keys', { cookie }));
    expect(list.keys[0].revokedAt).not.toBeNull();
  });

  it('stops accepting a key once it is revoked', async () => {
    const { app, cookie, key, token } = await withKey();
    expect((await call(app, 'GET', '/api/links', { headers: bearer(token) })).status).toBe(200);
    await call(app, 'DELETE', `/api/keys/${key.id}`, { cookie });
    const res = await call(app, 'POST', '/api/links', {
      headers: bearer(token),
      json: { url: 'https://example.com' },
    });
    expect(res.status).toBe(401);
  });

  it("can't revoke someone else's key", async () => {
    const { app, key } = await withKey();
    const other = await registerUser(app);
    const res = await call(app, 'DELETE', `/api/keys/${key.id}`, { cookie: other });
    expect(res.status).toBe(404);
  });
});
