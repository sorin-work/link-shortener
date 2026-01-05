import { and, eq, ne } from 'drizzle-orm';
import type { Config } from '../config.js';
import type { Db } from '../db/client.js';
import { links, type Link } from '../db/schema.js';
import { conflict, notFound } from '../lib/errors.js';
import { generateSlug } from '../lib/slug.js';

export function serializeLink(link: Link, config: Config, clicks = 0) {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: `${config.baseUrl}/${link.slug}`,
    url: link.url,
    title: link.title,
    clicks,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export type LinkDto = ReturnType<typeof serializeLink>;

export function slugTaken(db: Db, slug: string, exceptId?: number): boolean {
  const where = exceptId ? and(eq(links.slug, slug), ne(links.id, exceptId)) : eq(links.slug, slug);
  return !!db.select({ id: links.id }).from(links).where(where).get();
}

/** Loads a link owned by the user, or throws a 404 (also for other users' links). */
export function getOwnLink(db: Db, userId: number, id: number): Link {
  const link = db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .get();
  if (!link) throw notFound('Link not found');
  return link;
}

/** Picks a random slug that is not in use yet. */
export function uniqueSlug(db: Db): string {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    if (!slugTaken(db, slug)) return slug;
  }
  // Practically unreachable with 31^7 combinations, but don't loop forever.
  throw conflict('Could not generate a free slug, please try again');
}
