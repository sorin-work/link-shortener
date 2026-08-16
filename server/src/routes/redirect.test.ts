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

  it('ignores the case of the slug in the url', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com/' });
    const res = await call(app, 'GET', `/${link.slug.toUpperCase()}`);
    expect(res.status).toBe(302);
  });

  it('finds custom slugs typed with capital letters', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, {
      url: 'https://example.com/',
      slug: 'Spring-Sale',
    });
    expect(link.slug).toBe('spring-sale');
    expect((await call(app, 'GET', '/Spring-Sale')).status).toBe(302);
    expect((await call(app, 'GET', '/spring-sale')).status).toBe(302);
    const clash = await call(app, 'POST', '/api/links', {
      cookie,
      json: { url: 'https://other.example', slug: 'SPRING-SALE' },
    });
    expect(clash.status).toBe(409);
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

  it('takes the country from the configured header', async () => {
    const { app, db } = setup({ countryHeader: 'x-country' });
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com' });
    await call(app, 'GET', `/${link.slug}`, { headers: { 'x-country': 'nl' } });
    await call(app, 'GET', `/${link.slug}`, { headers: { 'cf-ipcountry': 'FR' } });
    expect(
      db
        .select()
        .from(clicks)
        .all()
        .map((row) => row.country),
    ).toEqual(['NL', null]);
  });

  it('answers HEAD without recording a click', async () => {
    const { app, db } = setup();
    const cookie = await registerUser(app);
    await createLink(app, cookie, { url: 'https://example.com/', slug: 'probe' });
    const res = await app.request('/probe', { method: 'HEAD' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://example.com/');
    expect(db.select().from(clicks).all()).toHaveLength(0);
  });

  it('does not swallow api routes', async () => {
    const { app } = setup();
    const res = await call(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
  });
});
