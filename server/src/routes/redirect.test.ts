import { describe, expect, it } from 'vitest';
import { call, createLink, registerUser, setup } from '../test/helpers.js';

describe('GET /:slug', () => {
  it('redirects to the destination without caching', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    await createLink(app, cookie, { url: 'https://example.com/page?x=1', slug: 'docs' });

    const res = await call(app, 'GET', '/docs');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://example.com/page?x=1');
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('shows a not found page for unknown slugs', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/missing');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('Link not found');
  });

  it('stops redirecting once the link is deleted', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com' });
    await call(app, 'DELETE', `/api/links/${link.id}`, { cookie });
    const res = await call(app, 'GET', `/${link.slug}`);
    expect(res.status).toBe(404);
  });

  it('does not swallow api routes', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
  });
});
