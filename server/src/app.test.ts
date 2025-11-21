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

describe('unknown routes', () => {
  it('return a json 404', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/nope');
    expect(res.status).toBe(404);
    const body = await readJson(res);
    expect(body.error.code).toBe('not_found');
  });
});
