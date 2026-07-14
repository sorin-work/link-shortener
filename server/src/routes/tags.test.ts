import { describe, expect, it } from 'vitest';
import { call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

async function tagged() {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  await createLink(ctx.app, cookie, {
    url: 'https://a.example',
    slug: 'one',
    tags: ['Spring', 'email'],
  });
  await createLink(ctx.app, cookie, { url: 'https://b.example', slug: 'two', tags: ['spring'] });
  await createLink(ctx.app, cookie, { url: 'https://c.example', slug: 'three' });
  return { ...ctx, cookie };
}

describe('tags', () => {
  it('normalises and de-duplicates tags', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, {
      url: 'https://a.example',
      tags: [' News ', 'news', 'été'],
    });
    expect((link as unknown as { tags: string[] }).tags).toEqual(['news', 'été']);
  });

  it('filters the list by tag', async () => {
    const { app, cookie } = await tagged();
    const body = await readJson(await call(app, 'GET', '/api/links?tag=spring', { cookie }));
    expect(body.links.map((l: { slug: string }) => l.slug)).toEqual(['two', 'one']);
    expect(body.total).toBe(2);
  });

  it('lists tags with counts', async () => {
    const { app, cookie } = await tagged();
    const body = await readJson(await call(app, 'GET', '/api/links/tags', { cookie }));
    expect(body.tags).toEqual([
      { name: 'email', links: 1 },
      { name: 'spring', links: 2 },
    ]);
  });

  it('replaces tags on update and validates them', async () => {
    const { app, cookie } = await tagged();
    const list = await readJson(await call(app, 'GET', '/api/links?tag=email', { cookie }));
    const id = list.links[0].id;
    const res = await call(app, 'PATCH', `/api/links/${id}`, { cookie, json: { tags: ['q3'] } });
    expect((await readJson(res)).link.tags).toEqual(['q3']);
    const bad = await call(app, 'PATCH', `/api/links/${id}`, {
      cookie,
      json: { tags: ['has space'] },
    });
    expect(bad.status).toBe(400);
  });
});
