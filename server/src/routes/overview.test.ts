import { describe, expect, it } from 'vitest';
import { clicks } from '../db/schema.js';
import { call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

const DAY = 86_400_000;

describe('GET /api/overview', () => {
  it('sums this week and last week for the user only', async () => {
    const { app, db } = setup();
    const cookie = await registerUser(app);
    const a = await createLink(app, cookie, { url: 'https://a.example', slug: 'aaa' });
    const b = await createLink(app, cookie, { url: 'https://b.example', slug: 'bbb' });
    const other = await registerUser(app);
    const c = await createLink(app, other, { url: 'https://c.example', slug: 'ccc' });
    const at = (d: number) => new Date(Date.now() - d * DAY);
    db.insert(clicks)
      .values([
        { linkId: a.link.id, createdAt: at(1) },
        { linkId: a.link.id, createdAt: at(2) },
        { linkId: b.link.id, createdAt: at(3) },
        { linkId: b.link.id, createdAt: at(9) },
        { linkId: b.link.id, createdAt: at(1), isBot: true },
        { linkId: c.link.id, createdAt: at(1) },
      ])
      .run();

    const body = await readJson(await call(app, 'GET', '/api/overview', { cookie }));
    expect(body).toMatchObject({ links: 2, clicksThisWeek: 3, clicksLastWeek: 1 });
    expect(body.topLinks.map((l: { slug: string }) => l.slug)).toEqual(['aaa', 'bbb']);
  });
});
