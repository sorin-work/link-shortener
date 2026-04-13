import { and, count, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { clicks, type Link } from '../db/schema.js';
import { isBot } from '../lib/bots.js';
import { normalizeCountry } from '../lib/country.js';
import { referrerHost } from '../lib/referrer.js';
import { parseUserAgent } from '../lib/useragent.js';

export interface ClickInfo {
  referrer?: string | null;
  userAgent?: string | null;
  country?: string | null;
  at?: Date;
}

const clip = (value: string | null | undefined, max: number) =>
  value ? value.slice(0, max) : null;

export function countClicks(db: Db, linkId: number): number {
  return (
    db
      .select({ n: count() })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false)))
      .get()?.n ?? 0
  );
}

export function buildClick(linkId: number, info: ClickInfo): typeof clicks.$inferInsert {
  return {
    linkId,
    createdAt: info.at ?? new Date(),
    referrer: clip(info.referrer, 1024),
    referrerHost: referrerHost(info.referrer),
    userAgent: clip(info.userAgent, 512),
    ...parseUserAgent(info.userAgent),
    country: normalizeCountry(info.country),
    isBot: isBot(info.userAgent),
  };
}

export function recordClick(db: Db, link: Link, info: ClickInfo) {
  db.insert(clicks).values(buildClick(link.id, info)).run();
}
