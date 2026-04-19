import { describe, expect, it } from 'vitest';
import { call, createLink, registerUser, setup } from '../test/helpers.js';

async function withLink() {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  const { link } = await createLink(ctx.app, cookie, { url: 'https://example.com', slug: 'qr-me' });
  return { ...ctx, cookie, link };
}

describe('GET /api/links/:id/qr', () => {
  it('renders an svg by default', async () => {
    const { app, cookie, link } = await withLink();
    const res = await call(app, 'GET', `/api/links/${link.id}/qr`, { cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml');
    expect(await res.text()).toMatch(/^<svg/);
  });

  it('renders a png download', async () => {
    const { app, cookie, link } = await withLink();
    const res = await call(app, 'GET', `/api/links/${link.id}/qr?format=png&size=512&download=1`, {
      cookie,
    });
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('content-disposition')).toContain('qr-me-qr.png');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(1, 4)].map((b) => String.fromCharCode(b)).join('')).toBe('PNG');
  });

  it('validates the size', async () => {
    const { app, cookie, link } = await withLink();
    const res = await call(app, 'GET', `/api/links/${link.id}/qr?size=5000`, { cookie });
    expect(res.status).toBe(400);
  });

  it("is not available for other users' links", async () => {
    const { app, link } = await withLink();
    const other = await registerUser(app);
    const res = await call(app, 'GET', `/api/links/${link.id}/qr`, { cookie: other });
    expect(res.status).toBe(404);
  });
});
