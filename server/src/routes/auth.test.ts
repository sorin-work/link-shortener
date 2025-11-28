import { describe, expect, it } from 'vitest';
import { sessions } from '../db/schema.js';
import { call, readJson, registerUser, sessionCookie, setup } from '../test/helpers.js';

const alice = { email: 'alice@example.com', name: 'Alice', password: 'correct-horse' };

describe('POST /api/auth/register', () => {
  it('creates the user and starts a session', async () => {
    const { app } = setup();
    const res = await call(app, 'POST', '/api/auth/register', { json: alice });
    expect(res.status).toBe(201);
    const body = await readJson(res);
    expect(body.user).toMatchObject({ email: 'alice@example.com', name: 'Alice' });
    expect(body.user.passwordHash).toBeUndefined();
    expect(res.headers.get('set-cookie')).toMatch(/sid=.+; .*HttpOnly/);
  });

  it('normalises the email address', async () => {
    const { app } = setup();
    const res = await call(app, 'POST', '/api/auth/register', {
      json: { ...alice, email: '  Alice@Example.COM ' },
    });
    expect((await readJson(res)).user.email).toBe('alice@example.com');
  });

  it('rejects a duplicate email', async () => {
    const { app } = setup();
    await call(app, 'POST', '/api/auth/register', { json: alice });
    const res = await call(app, 'POST', '/api/auth/register', {
      json: { ...alice, email: 'ALICE@example.com' },
    });
    expect(res.status).toBe(409);
  });

  it('validates the payload', async () => {
    const { app } = setup();
    const res = await call(app, 'POST', '/api/auth/register', {
      json: { email: 'nope', name: '', password: 'short' },
    });
    expect(res.status).toBe(400);
    const body = await readJson(res);
    expect(body.error.code).toBe('validation_error');
    expect(body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
      'email',
      'name',
      'password',
    ]);
  });

  it('answers malformed json with a 400', async () => {
    const { app } = setup();
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('starts a session with the right password', async () => {
    const { app } = setup();
    await call(app, 'POST', '/api/auth/register', { json: alice });
    const res = await call(app, 'POST', '/api/auth/login', {
      json: { email: 'ALICE@example.com', password: alice.password },
    });
    expect(res.status).toBe(200);
    const me = await call(app, 'GET', '/api/auth/me', { cookie: sessionCookie(res) });
    expect((await readJson(me)).user.email).toBe(alice.email);
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    const { app } = setup();
    await call(app, 'POST', '/api/auth/register', { json: alice });
    const wrong = await call(app, 'POST', '/api/auth/login', {
      json: { email: alice.email, password: 'wrong-password' },
    });
    const unknown = await call(app, 'POST', '/api/auth/login', {
      json: { email: 'bob@example.com', password: 'whatever' },
    });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect((await readJson(wrong)).error.message).toBe((await readJson(unknown)).error.message);
  });
});

describe('sessions', () => {
  it('requires a cookie for /me', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('ends the session on logout', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const out = await call(app, 'POST', '/api/auth/logout', { cookie });
    expect(out.status).toBe(204);
    const me = await call(app, 'GET', '/api/auth/me', { cookie });
    expect(me.status).toBe(401);
  });

  it('ignores expired sessions', async () => {
    const { app, db } = setup();
    const cookie = await registerUser(app);
    db.update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .run();
    const me = await call(app, 'GET', '/api/auth/me', { cookie });
    expect(me.status).toBe(401);
  });
});
