import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app.js';
import { links } from '../db/schema.js';
import { gonePage, notFoundPage } from '../pages.js';
import { recordClick } from '../services/clicks.js';

export function redirectRoutes({ db, config }: AppDeps) {
  const r = new Hono();

  r.get('/:slug', (c) => {
    const link = db
      .select()
      .from(links)
      .where(eq(links.slug, c.req.param('slug')))
      .get();
    if (!link) return c.html(notFoundPage(), 404);
    if (link.expiresAt && link.expiresAt <= new Date()) {
      return c.html(gonePage('This link has expired.'), 410);
    }

    recordClick(db, link, {
      referrer: c.req.header('referer'),
      userAgent: c.req.header('user-agent'),
      country: c.req.header(config.countryHeader),
    });

    // Every hit has to reach us to be counted, so browsers must not cache it.
    c.header('Cache-Control', 'private, no-store');
    return c.redirect(link.url, 302);
  });

  return r;
}
