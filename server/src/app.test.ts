import { describe, expect, it } from 'vitest';
import { call, readJson, setup } from './test/helpers.js';

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('security headers', () => {
  it('are set on every response', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  });
});

describe('request ids', () => {
  it('are returned in a header and in error bodies', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/auth/me');
    const id = res.headers.get('x-request-id');
    expect(id).toBeTruthy();
    expect((await readJson(res)).error.requestId).toBe(id);
  });
});

describe('GET /robots.txt', () => {
  it('disallows crawling', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/robots.txt');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('unknown routes', () => {
  it('return a json 404', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/nope');
    expect(res.status).toBe(404);
    const body = await readJson(res);
    expect(body.error.code).toBe('not_found');
  });
});
