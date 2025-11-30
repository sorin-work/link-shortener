import { eq } from 'drizzle-orm';
import type { Config } from '../config.js';
import type { Db } from '../db/client.js';
import { links, type Link } from '../db/schema.js';
import { conflict } from '../lib/errors.js';
import { generateSlug } from '../lib/slug.js';

export function serializeLink(link: Link, config: Config) {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: `${config.baseUrl}/${link.slug}`,
    url: link.url,
    title: link.title,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export type LinkDto = ReturnType<typeof serializeLink>;

export function slugTaken(db: Db, slug: string): boolean {
  return !!db.select({ id: links.id }).from(links).where(eq(links.slug, slug)).get();
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
