import { eq, sql } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import type { AppDeps } from '../app.js';
import { links, type Link } from '../db/schema.js';
import { clientIp } from '../lib/clientIp.js';
import { verifyPassword } from '../lib/password.js';
import { createRateLimiter } from '../lib/rateLimit.js';
import { gonePage, notFoundPage, tooManyAttemptsPage, unlockPage } from '../pages.js';
import { recordClick } from '../services/clicks.js';
import { availability } from '../services/links.js';

const UNAVAILABLE: Record<string, string> = {
  expired: 'This link has expired.',
  limit_reached: 'This link has reached its click limit.',
};

export function redirectRoutes({ db, config }: AppDeps) {
  const r = new Hono();
  const unlockAttempts = createRateLimiter({ windowMs: 15 * 60_000, max: 10 });

  const findLink = (slug: string) =>
    db.select().from(links).where(eq(links.slug, slug.toLowerCase())).get();

  /** Responds for links that can't be followed right now, or returns null. */
  const blocked = (c: Context, link: Link) => {
    const state = availability(link);
    return state === 'active' ? null : c.html(gonePage(UNAVAILABLE[state]!), 410);
  };

  const follow = (c: Context, link: Link) => {
    recordClick(db, link, {
      referrer: c.req.header('referer'),
      userAgent: c.req.header('user-agent'),
      country: c.req.header(config.countryHeader),
    });
    db.update(links)
      .set({ clickCount: sql`${links.clickCount} + 1` })
      .where(eq(links.id, link.id))
      .run();

    // Every hit has to reach us to be counted, so browsers must not cache it.
    c.header('Cache-Control', 'private, no-store');
    return c.redirect(link.url, 302);
  };

  r.get('/:slug', (c) => {
    const link = findLink(c.req.param('slug'));
    if (!link) return c.html(notFoundPage(), 404);
    const stop = blocked(c, link);
    if (stop) return stop;

    if (link.passwordHash) {
      c.header('Cache-Control', 'private, no-store');
      return c.html(unlockPage(link));
    }
    return follow(c, link);
  });

  r.post('/:slug', async (c) => {
    const link = findLink(c.req.param('slug'));
    if (!link) return c.html(notFoundPage(), 404);
    const stop = blocked(c, link);
    if (stop) return stop;
    if (!link.passwordHash) return follow(c, link);

    const key = `${link.id}:${clientIp(c, config.trustProxy)}`;
    const limit = unlockAttempts.hit(key);
    if (!limit.allowed) {
      c.header('Retry-After', String(limit.retryAfter));
      return c.html(tooManyAttemptsPage(limit.retryAfter), 429);
    }

    const form = await c.req.parseBody();
    const password = typeof form.password === 'string' ? form.password : '';
    if (!(await verifyPassword(password, link.passwordHash))) {
      return c.html(unlockPage(link, 'Wrong password, try again.'), 401);
    }
    unlockAttempts.reset(key);
    return follow(c, link);
  });

  return r;
}
