import { describe, expect, it } from 'vitest';
import { clicks } from '../db/schema.js';
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

  it('records a click with referrer and user agent', async () => {
    const { app, db } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com' });
    await call(app, 'GET', `/${link.slug}`, {
      headers: { referer: 'https://news.example/item', 'user-agent': 'TestAgent/1.0' },
    });
    await call(app, 'GET', `/${link.slug}`);
    const rows = db.select().from(clicks).all();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      linkId: link.id,
      referrer: 'https://news.example/item',
      userAgent: 'TestAgent/1.0',
    });
    expect(rows[1]?.referrer).toBeNull();
  });

  it('does not swallow api routes', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
  });
});
