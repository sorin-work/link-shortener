import { describe, expect, it } from 'vitest';
import { call, setup } from './test/helpers.js';

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
