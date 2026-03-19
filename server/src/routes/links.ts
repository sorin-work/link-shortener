import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { links } from '../db/schema.js';
import { parseExpiry } from '../lib/dates.js';
import { badRequest, conflict } from '../lib/errors.js';
import { checkCustomSlug } from '../lib/slug.js';
import { normalizeDestination } from '../lib/url.js';
import { validate } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { countClicks } from '../services/clicks.js';
import { getOwnLink, listLinks, serializeLink, slugTaken, uniqueSlug } from '../services/links.js';
import type { AppEnv } from '../types.js';

const idParam = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
});

const createSchema = z.object({
  url: z.string().max(4096),
  slug: z.string().trim().optional(),
  title: z.string().trim().max(200).optional(),
  expiresAt: z.string().max(40).nullable().optional(),
  maxClicks: z.number().int().min(1).max(10_000_000).nullable().optional(),
});

const updateSchema = z.object({
  url: z.string().max(4096).optional(),
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().max(200).nullable().optional(),
  expiresAt: z.string().max(40).nullable().optional(),
  maxClicks: z.number().int().min(1).max(10_000_000).nullable().optional(),
});

export function linkRoutes({ db, config }: AppDeps) {
  const r = new Hono<AppEnv>();
  r.use('*', requireUser(db));

  const destinationOrThrow = (url: string) => {
    const destination = normalizeDestination(url, config.baseUrl);
    if (!destination.ok) {
      throw badRequest(destination.error, [{ path: 'url', message: destination.error }]);
    }
    return destination.url;
  };

  const expiryOrThrow = (value: string | null | undefined) => {
    if (!value) return null;
    const date = parseExpiry(value);
    const problem = !date
      ? 'Enter a valid date'
      : date <= new Date()
        ? 'Expiry must be in the future'
        : null;
    if (problem) throw badRequest(problem, [{ path: 'expiresAt', message: problem }]);
    return date;
  };

  const customSlugOrThrow = (slug: string, exceptId?: number) => {
    const problem = checkCustomSlug(slug);
    if (problem) throw badRequest(problem, [{ path: 'slug', message: problem }]);
    if (slugTaken(db, slug, exceptId)) throw conflict(`The slug "${slug}" is already taken`);
    return slug;
  };

  r.get('/', validate('query', listQuery), (c) => {
    return c.json(listLinks(db, config, c.get('user').id, c.req.valid('query')));
  });

  r.get('/:id', validate('param', idParam), (c) => {
    const link = getOwnLink(db, c.get('user').id, c.req.valid('param').id);
    return c.json({ link: serializeLink(link, config, countClicks(db, link.id)) });
  });

  r.post('/', validate('json', createSchema), (c) => {
    const input = c.req.valid('json');
    const url = destinationOrThrow(input.url);
    const slug = input.slug ? customSlugOrThrow(input.slug) : uniqueSlug(db);
    const expiresAt = expiryOrThrow(input.expiresAt);

    const link = db
      .insert(links)
      .values({
        userId: c.get('user').id,
        slug,
        url,
        title: input.title || null,
        expiresAt,
        maxClicks: input.maxClicks ?? null,
      })
      .returning()
      .get();
    return c.json({ link: serializeLink(link, config) }, 201);
  });

  r.patch('/:id', validate('param', idParam), validate('json', updateSchema), (c) => {
    const input = c.req.valid('json');
    const link = getOwnLink(db, c.get('user').id, c.req.valid('param').id);

    const changes: Partial<typeof links.$inferInsert> = { updatedAt: new Date() };
    if (input.url !== undefined) changes.url = destinationOrThrow(input.url);
    if (input.slug !== undefined && input.slug !== link.slug) {
      changes.slug = customSlugOrThrow(input.slug, link.id);
    }
    if (input.title !== undefined) changes.title = input.title || null;
    if (input.expiresAt !== undefined) changes.expiresAt = expiryOrThrow(input.expiresAt);
    if (input.maxClicks !== undefined) changes.maxClicks = input.maxClicks;

    const updated = db.update(links).set(changes).where(eq(links.id, link.id)).returning().get();
    return c.json({ link: serializeLink(updated, config) });
  });

  r.delete('/:id', validate('param', idParam), (c) => {
    const user = c.get('user');
    const link = getOwnLink(db, user.id, c.req.valid('param').id);
    db.delete(links)
      .where(and(eq(links.id, link.id), eq(links.userId, user.id)))
      .run();
    return c.body(null, 204);
  });

  return r;
}
