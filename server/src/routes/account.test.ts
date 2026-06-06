import { describe, expect, it } from 'vitest';
import { links, users } from '../db/schema.js';
import { call, createLink, readJson, registerUser, sessionCookie, setup } from '../test/helpers.js';

async function signedIn() {
  const ctx = setup();
  const email = 'carol@example.com';
  const cookie = await registerUser(ctx.app, email);
  return { ...ctx, email, cookie };
}

describe('account settings', () => {
  it('renames the user', async () => {
    const { app, cookie } = await signedIn();
    const res = await call(app, 'PATCH', '/api/auth/me', { cookie, json: { name: ' Carol ' } });
    expect((await readJson(res)).user.name).toBe('Carol');
  });

  it('changes the password and signs out other sessions', async () => {
    const { app, email, cookie } = await signedIn();
    const login = await call(app, 'POST', '/api/auth/login', {
      json: { email, password: 'correct-horse' },
    });
    const otherDevice = sessionCookie(login);

    const res = await call(app, 'POST', '/api/auth/password', {
      cookie,
      json: { currentPassword: 'correct-horse', newPassword: 'battery-staple' },
    });
    expect(res.status).toBe(204);
    expect((await call(app, 'GET', '/api/auth/me', { cookie })).status).toBe(200);
    expect((await call(app, 'GET', '/api/auth/me', { cookie: otherDevice })).status).toBe(401);
    const relogin = await call(app, 'POST', '/api/auth/login', {
      json: { email, password: 'battery-staple' },
    });
    expect(relogin.status).toBe(200);
  });

  it('requires the current password to change it', async () => {
    const { app, cookie } = await signedIn();
    const res = await call(app, 'POST', '/api/auth/password', {
      cookie,
      json: { currentPassword: 'wrong', newPassword: 'battery-staple' },
    });
    expect(res.status).toBe(400);
    expect((await readJson(res)).error.details[0].path).toBe('currentPassword');
  });

  it('deletes the account with everything in it', async () => {
    const { app, db, cookie } = await signedIn();
    await createLink(app, cookie, { url: 'https://example.com' });
    const wrong = await call(app, 'DELETE', '/api/auth/me', { cookie, json: { password: 'x' } });
    expect(wrong.status).toBe(400);
    const res = await call(app, 'DELETE', '/api/auth/me', {
      cookie,
      json: { password: 'correct-horse' },
    });
    expect(res.status).toBe(204);
    expect(db.select().from(users).all()).toHaveLength(0);
    expect(db.select().from(links).all()).toHaveLength(0);
  });
});
