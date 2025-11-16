import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db/client.js';

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const config = loadConfig({});
    const db = openDatabase(':memory:', config.migrationsDir);
    const res = await createApp({ db, config }).request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
