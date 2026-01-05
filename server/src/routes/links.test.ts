import { describe, expect, it } from 'vitest';
import { call, readJson, registerUser, setup } from '../test/helpers.js';

async function withUser() {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  const create = async (json: Record<string, unknown>) => {
    const res = await call(ctx.app, 'POST', '/api/links', { cookie, json });
    return { res, body: await readJson(res) };
  };
  return { ...ctx, cookie, create };
}

describe('POST /api/links', () => {
  it('creates a link with a generated slug', async () => {
    const { create } = await withUser();
    const { res, body } = await create({ url: 'https://example.com/docs' });
    expect(res.status).toBe(201);
    expect(body.link.slug).toMatch(/^[a-z2-9]{7}$/);
    expect(body.link.shortUrl).toBe(`http://sho.rt/${body.link.slug}`);
    expect(body.link.url).toBe('https://example.com/docs');
  });

  it('uses a custom slug and title', async () => {
    const { create } = await withUser();
    const { body } = await create({ url: 'example.com', slug: 'launch', title: ' Launch post ' });
    expect(body.link).toMatchObject({
      slug: 'launch',
      title: 'Launch post',
      url: 'https://example.com/',
    });
  });

  it('refuses a slug that is already taken', async () => {
    const { create } = await withUser();
    await create({ url: 'https://a.example', slug: 'taken' });
    const { res } = await create({ url: 'https://b.example', slug: 'taken' });
    expect(res.status).toBe(409);
  });

  it('refuses invalid slugs and urls with field details', async () => {
    const { create } = await withUser();
    const slug = await create({ url: 'https://a.example', slug: 'api' });
    expect(slug.res.status).toBe(400);
    expect(slug.body.error.details[0].path).toBe('slug');
    const url = await create({ url: 'javascript:alert(1)' });
    expect(url.res.status).toBe(400);
    expect(url.body.error.details[0].path).toBe('url');
  });

  it('requires a session', async () => {
    const { app } = setup();
    const res = await call(app, 'POST', '/api/links', { json: { url: 'https://a.example' } });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/links', () => {
  it("lists only the user's own links, newest first", async () => {
    const { app, cookie, create } = await withUser();
    await create({ url: 'https://one.example' });
    await create({ url: 'https://two.example' });
    const other = await registerUser(app);
    await call(app, 'POST', '/api/links', { cookie: other, json: { url: 'https://x.example' } });

    const res = await call(app, 'GET', '/api/links', { cookie });
    const body = await readJson(res);
    expect(body.links.map((l: { url: string }) => l.url)).toEqual([
      'https://two.example/',
      'https://one.example/',
    ]);
  });

  it('pages through the list', async () => {
    const { app, cookie, create } = await withUser();
    for (let i = 1; i <= 5; i++) await create({ url: `https://site${i}.example` });
    const res = await call(app, 'GET', '/api/links?limit=2&page=2', { cookie });
    const body = await readJson(res);
    expect(body).toMatchObject({ page: 2, limit: 2, total: 5 });
    expect(body.links.map((l: { url: string }) => l.url)).toEqual([
      'https://site3.example/',
      'https://site2.example/',
    ]);
  });

  it('searches slug, url and title', async () => {
    const { app, cookie, create } = await withUser();
    await create({ url: 'https://blog.example/post', title: 'Spring sale' });
    await create({ url: 'https://shop.example', slug: 'summer' });
    await create({ url: 'https://other.example' });
    const bySale = await readJson(await call(app, 'GET', '/api/links?q=sale', { cookie }));
    expect(bySale.total).toBe(1);
    expect(bySale.links[0].title).toBe('Spring sale');
    const bySlug = await readJson(await call(app, 'GET', '/api/links?q=SUMM', { cookie }));
    expect(bySlug.links[0].slug).toBe('summer');
  });

  it('treats % and _ in searches literally', async () => {
    const { app, cookie, create } = await withUser();
    await create({ url: 'https://a.example', title: '100% off' });
    await create({ url: 'https://b.example', title: '100 off' });
    const body = await readJson(await call(app, 'GET', '/api/links?q=100%25', { cookie }));
    expect(body.total).toBe(1);
  });

  it('rejects an out of range page size', async () => {
    const { app, cookie } = await withUser();
    const res = await call(app, 'GET', '/api/links?limit=500', { cookie });
    expect(res.status).toBe(400);
  });

  it('includes click counts', async () => {
    const { app, cookie, create } = await withUser();
    const { body } = await create({ url: 'https://one.example', slug: 'counted' });
    await create({ url: 'https://two.example' });
    await call(app, 'GET', '/counted');
    await call(app, 'GET', '/counted');
    const list = await readJson(await call(app, 'GET', '/api/links', { cookie }));
    expect(list.links.map((l: { clicks: number }) => l.clicks)).toEqual([0, 2]);
    const one = await readJson(await call(app, 'GET', `/api/links/${body.link.id}`, { cookie }));
    expect(one.link.clicks).toBe(2);
  });

  it("hides other users' links behind a 404", async () => {
    const { app, create } = await withUser();
    const { body } = await create({ url: 'https://one.example' });
    const other = await registerUser(app);
    const res = await call(app, 'GET', `/api/links/${body.link.id}`, { cookie: other });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/links/:id', () => {
  it('updates the destination, slug and title', async () => {
    const { app, cookie, create } = await withUser();
    const { body } = await create({ url: 'https://one.example', title: 'Old' });
    const res = await call(app, 'PATCH', `/api/links/${body.link.id}`, {
      cookie,
      json: { url: 'https://two.example/new', slug: 'renamed', title: null },
    });
    expect(res.status).toBe(200);
    expect((await readJson(res)).link).toMatchObject({
      url: 'https://two.example/new',
      slug: 'renamed',
      title: null,
    });
  });

  it('allows keeping the same slug but not taking another one', async () => {
    const { app, cookie, create } = await withUser();
    await create({ url: 'https://one.example', slug: 'first' });
    const { body } = await create({ url: 'https://two.example', slug: 'second' });
    const same = await call(app, 'PATCH', `/api/links/${body.link.id}`, {
      cookie,
      json: { slug: 'second' },
    });
    expect(same.status).toBe(200);
    const clash = await call(app, 'PATCH', `/api/links/${body.link.id}`, {
      cookie,
      json: { slug: 'first' },
    });
    expect(clash.status).toBe(409);
  });
});

describe('DELETE /api/links/:id', () => {
  it('deletes the link', async () => {
    const { app, cookie, create } = await withUser();
    const { body } = await create({ url: 'https://one.example' });
    const del = await call(app, 'DELETE', `/api/links/${body.link.id}`, { cookie });
    expect(del.status).toBe(204);
    const get = await call(app, 'GET', `/api/links/${body.link.id}`, { cookie });
    expect(get.status).toBe(404);
  });

  it("can't delete someone else's link", async () => {
    const { app, cookie, create } = await withUser();
    const { body } = await create({ url: 'https://one.example' });
    const other = await registerUser(app);
    const del = await call(app, 'DELETE', `/api/links/${body.link.id}`, { cookie: other });
    expect(del.status).toBe(404);
    const get = await call(app, 'GET', `/api/links/${body.link.id}`, { cookie });
    expect(get.status).toBe(200);
  });
});
