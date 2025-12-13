import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppDeps } from '../app.js';
import { links } from '../db/schema.js';
import { notFoundPage } from '../pages.js';

export function redirectRoutes({ db }: AppDeps) {
  const r = new Hono();

  r.get('/:slug', (c) => {
    const link = db
      .select()
      .from(links)
      .where(eq(links.slug, c.req.param('slug')))
      .get();
    if (!link) return c.html(notFoundPage(), 404);

    // Every hit has to reach us to be counted, so browsers must not cache it.
    c.header('Cache-Control', 'private, no-store');
    return c.redirect(link.url, 302);
  });

  return r;
}
