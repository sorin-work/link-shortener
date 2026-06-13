import { and, asc, count, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import type { Config } from '../config.js';
import type { Db } from '../db/client.js';
import { links, type Link } from '../db/schema.js';
import { conflict, notFound } from '../lib/errors.js';
import { generateSlug } from '../lib/slug.js';
import { countClicks } from './clicks.js';

export type Availability = 'active' | 'expired' | 'limit_reached';

export function availability(link: Link, now = new Date()): Availability {
  if (link.expiresAt && link.expiresAt <= now) return 'expired';
  if (link.maxClicks !== null && link.clickCount >= link.maxClicks) return 'limit_reached';
  return 'active';
}

export function serializeLink(link: Link, config: Config, clicks = 0) {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: `${config.baseUrl}/${link.slug}`,
    url: link.url,
    title: link.title,
    clicks,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    expired: !!link.expiresAt && link.expiresAt <= new Date(),
    maxClicks: link.maxClicks,
    clickCount: link.clickCount,
    status: availability(link),
    hasPassword: !!link.passwordHash,
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

export const LINK_SORTS = ['newest', 'oldest', 'clicks', 'slug'] as const;
export type LinkSort = (typeof LINK_SORTS)[number];

export interface ListOptions {
  page: number;
  limit: number;
  q?: string;
  sort?: LinkSort;
}

const humanClicks = sql`(select count(*) from clicks where clicks.link_id = ${links.id} and clicks.is_bot = 0)`;

const ORDER: Record<LinkSort, SQL[]> = {
  newest: [desc(links.createdAt), desc(links.id)],
  oldest: [asc(links.createdAt), asc(links.id)],
  clicks: [sql`${humanClicks} desc`, desc(links.id)],
  slug: [asc(links.slug)],
};

const likeEscape = (value: string) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export function listLinks(db: Db, config: Config, userId: number, opts: ListOptions) {
  const { page, limit, q, sort = 'newest' } = opts;
  const owner = eq(links.userId, userId);
  let where = owner;
  if (q) {
    const pattern = `%${likeEscape(q)}%`;
    const match = sql`(${links.slug} like ${pattern} escape '\\' or ${links.url} like ${pattern} escape '\\' or ${links.title} like ${pattern} escape '\\')`;
    where = and(owner, match)!;
  }

  const total = db.select({ n: count() }).from(links).where(where).get()?.n ?? 0;
  const rows = db
    .select()
    .from(links)
    .where(where)
    .orderBy(...ORDER[sort])
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return {
    links: rows.map((link) => serializeLink(link, config, countClicks(db, link.id))),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
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
