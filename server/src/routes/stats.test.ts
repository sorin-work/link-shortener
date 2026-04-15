import { describe, expect, it } from 'vitest';
import { clicks } from '../db/schema.js';
import { call, createLink, readJson, registerUser, setup } from '../test/helpers.js';

const DAY = 86_400_000;

async function linkWithClicks() {
  const ctx = setup();
  const cookie = await registerUser(ctx.app);
  const { link } = await createLink(ctx.app, cookie, { url: 'https://example.com' });
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY);
  const rows = [
    {
      createdAt: at(2),
      referrerHost: 'google.com',
      device: 'mobile',
      browser: 'Safari',
      country: 'US',
    },
    {
      createdAt: at(2),
      referrerHost: 'google.com',
      device: 'desktop',
      browser: 'Chrome',
      country: 'US',
    },
    { createdAt: at(5), referrerHost: null, device: 'desktop', browser: 'Chrome', country: 'DE' },
    {
      createdAt: at(40),
      referrerHost: 'x.com',
      device: 'desktop',
      browser: 'Firefox',
      country: 'FR',
    },
  ];
  ctx.db
    .insert(clicks)
    .values(rows.map((row) => ({ ...row, linkId: link.id })))
    .run();
  return { ...ctx, cookie, link };
}

describe('GET /api/links/:id/stats', () => {
  it('counts clicks per day inside the range', async () => {
    const { app, cookie, link } = await linkWithClicks();
    const res = await call(app, 'GET', `/api/links/${link.id}/stats?days=30`, { cookie });
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.total).toBe(3);
    expect(body.byDay).toHaveLength(30);
    const day = (daysAgo: number) =>
      new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10);
    const lookup = Object.fromEntries(
      body.byDay.map((d: { date: string; clicks: number }) => [d.date, d.clicks]),
    );
    expect(lookup[day(2)]).toBe(2);
    expect(lookup[day(5)]).toBe(1);
  });

  it('breaks clicks down by referrer, device, browser and country', async () => {
    const { app, cookie, link } = await linkWithClicks();
    const body = await readJson(await call(app, 'GET', `/api/links/${link.id}/stats`, { cookie }));
    expect(body.referrers).toEqual([
      { name: 'google.com', clicks: 2 },
      { name: 'Direct', clicks: 1 },
    ]);
    expect(body.browsers[0]).toEqual({ name: 'Chrome', clicks: 2 });
    expect(body.devices).toContainEqual({ name: 'mobile', clicks: 1 });
    expect(body.countries[0]).toEqual({ name: 'US', clicks: 2 });
  });

  it('widens the range with ?days', async () => {
    const { app, cookie, link } = await linkWithClicks();
    const body = await readJson(
      await call(app, 'GET', `/api/links/${link.id}/stats?days=90`, { cookie }),
    );
    expect(body.total).toBe(4);
    expect(body.byDay).toHaveLength(90);
  });

  it('leaves bot clicks out unless asked for', async () => {
    const { app, db, cookie, link } = await linkWithClicks();
    db.insert(clicks)
      .values([
        { linkId: link.id, createdAt: new Date(Date.now() - DAY), isBot: true },
        { linkId: link.id, createdAt: new Date(Date.now() - DAY), isBot: true },
      ])
      .run();
    const human = await readJson(await call(app, 'GET', `/api/links/${link.id}/stats`, { cookie }));
    expect(human.total).toBe(3);
    expect(human.bots).toBe(2);
    const all = await readJson(
      await call(app, 'GET', `/api/links/${link.id}/stats?bots=include`, { cookie }),
    );
    expect(all.total).toBe(5);
    const list = await readJson(await call(app, 'GET', `/api/links/${link.id}`, { cookie }));
    expect(list.link.clicks).toBe(4);
  });

  it('flags crawler redirects as bots', async () => {
    const { app, db } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com', slug: 'unfurl' });
    await call(app, 'GET', '/unfurl', {
      headers: { 'user-agent': 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)' },
    });
    const [row] = db.select().from(clicks).all();
    expect(row).toMatchObject({ linkId: link.id, isBot: true });
  });

  it('validates the range', async () => {
    const { app, cookie, link } = await linkWithClicks();
    const res = await call(app, 'GET', `/api/links/${link.id}/stats?days=0`, { cookie });
    expect(res.status).toBe(400);
  });

  it('404s for unknown links and needs a session', async () => {
    const { app, cookie, link } = await linkWithClicks();
    expect((await call(app, 'GET', '/api/links/999/stats', { cookie })).status).toBe(404);
    expect((await call(app, 'GET', `/api/links/${link.id}/stats`)).status).toBe(401);
  });
});
