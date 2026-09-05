import { describe, expect, it } from 'vitest';
import { BROWSER_UA, call, createLink, registerUser, setup } from '../test/helpers.js';

describe('GET /api/links/export.csv', () => {
  it('lists every link of the user, oldest first', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    await createLink(app, cookie, { url: 'https://a.example/', slug: 'first', tags: ['x', 'y'] });
    await createLink(app, cookie, {
      url: 'https://b.example/',
      slug: 'second',
      title: 'Hi, there',
    });
    const other = await registerUser(app);
    await createLink(app, other, { url: 'https://c.example/', slug: 'not-mine' });

    const res = await call(app, 'GET', '/api/links/export.csv', { cookie });
    expect(res.headers.get('content-disposition')).toContain('links.csv');
    const lines = (await res.text()).trim().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(
      /^first,http:\/\/sho\.rt\/first,https:\/\/a\.example\/,,x y,0,active,/,
    );
    expect(lines[2]).toContain('"Hi, there"');
  });
});

describe('GET /api/links/:id/clicks.csv', () => {
  it('downloads the clicks of a link', async () => {
    const { app } = setup({ countryHeader: 'x-country' });
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com', slug: 'csv' });
    await call(app, 'GET', '/csv', {
      headers: {
        referer: 'https://www.google.com/',
        'user-agent': 'TestAgent/1.0',
        'x-country': 'de',
      },
    });

    const res = await call(app, 'GET', `/api/links/${link.id}/clicks.csv`, { cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('csv-clicks.csv');
    const lines = (await res.text()).trim().split('\r\n');
    expect(lines[0]).toBe('time,referrer,referrer_host,country,device,browser,os,bot,user_agent');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(',https://www.google.com/,google.com,DE,');
  });

  it('keeps real user agents in one column', async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com', slug: 'agent' });
    await call(app, 'GET', '/agent', { headers: { 'user-agent': BROWSER_UA } });
    const text = await (
      await call(app, 'GET', `/api/links/${link.id}/clicks.csv`, { cookie })
    ).text();
    const row = text.trim().split('\r\n')[1]!;
    expect(row.endsWith(`,"${BROWSER_UA}"`)).toBe(true);
  });

  it("is not available for other users' links", async () => {
    const { app } = setup();
    const cookie = await registerUser(app);
    const { link } = await createLink(app, cookie, { url: 'https://example.com' });
    const other = await registerUser(app);
    const res = await call(app, 'GET', `/api/links/${link.id}/clicks.csv`, { cookie: other });
    expect(res.status).toBe(404);
  });
});
