import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { afterAll, describe, expect, it } from 'vitest';
import { mountWeb } from './static.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-'));
fs.mkdirSync(path.join(dir, 'assets'));
fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><div id="app"></div>');
fs.writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), 'console.log(1)');

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('mountWeb', () => {
  const app = new Hono();
  const mounted = mountWeb(app, dir);

  it('mounts when a build exists', () => {
    expect(mounted).toBe(true);
    expect(mountWeb(new Hono(), path.join(dir, 'missing'))).toBe(false);
  });

  it('redirects the root to the dashboard', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/app/');
  });

  it('serves hashed assets with long caching', async () => {
    const res = await app.request('/app/assets/index-abc123.js');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('console.log(1)');
    expect(res.headers.get('cache-control')).toContain('immutable');
  });

  it('serves other files from the build, like the favicon', async () => {
    fs.writeFileSync(path.join(dir, 'favicon.svg'), '<svg/>');
    const res = await app.request('/app/favicon.svg');
    expect(await res.text()).toBe('<svg/>');
  });

  it('falls back to index.html for client routes', async () => {
    const res = await app.request('/app/links/42');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<div id="app">');
  });
});
