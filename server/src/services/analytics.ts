import { and, count, desc, eq, gte, lt, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { Db } from '../db/client.js';
import { clicks, links } from '../db/schema.js';
import { addDays, isoDay, startOfUtcDay, windowStart } from '../lib/dates.js';

export interface StatsOptions {
  days: number;
  now?: Date;
  includeBots?: boolean;
}

export interface DayCount {
  date: string;
  clicks: number;
}

export interface NamedCount {
  name: string;
  clicks: number;
}

const dayOf = sql<string>`strftime('%Y-%m-%d', ${clicks.createdAt} / 1000, 'unixepoch')`;

const hourOf = sql<string>`strftime('%H', ${clicks.createdAt} / 1000, 'unixepoch')`;

const BREAKDOWN_LIMIT = 10;

function breakdown(
  db: Db,
  where: SQL | undefined,
  column: SQLiteColumn,
  fallback: string,
): NamedCount[] {
  const n = count();
  return db
    .select({ name: column, n })
    .from(clicks)
    .where(where)
    .groupBy(column)
    .orderBy(desc(n))
    .limit(BREAKDOWN_LIMIT)
    .all()
    .map((row) => ({ name: (row.name as string | null) ?? fallback, clicks: row.n }));
}

/** Totals for the signed in user's dashboard: this week vs the week before. */
export function overview(db: Db, userId: number, now = new Date()) {
  const weekStart = windowStart(now, 7);
  const prevStart = addDays(weekStart, -7);
  const human = and(eq(links.userId, userId), eq(clicks.isBot, false));
  const clicksSince = (from: Date, to?: Date) =>
    db
      .select({ n: count() })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(and(human, gte(clicks.createdAt, from), to ? lt(clicks.createdAt, to) : undefined))
      .get()?.n ?? 0;

  const n = count();
  const top = db
    .select({ id: links.id, slug: links.slug, title: links.title, clicks: n })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(and(human, gte(clicks.createdAt, weekStart)))
    .groupBy(links.id)
    .orderBy(desc(n))
    .limit(5)
    .all();

  return {
    links: db.select({ n: count() }).from(links).where(eq(links.userId, userId)).get()?.n ?? 0,
    clicksThisWeek: clicksSince(weekStart),
    clicksLastWeek: clicksSince(prevStart, weekStart),
    topLinks: top,
  };
}

const EXPORT_LIMIT = 100_000;

/** Raw clicks for a CSV export, oldest first. */
export function clicksForExport(db: Db, linkId: number, { days, now = new Date() }: StatsOptions) {
  const since = windowStart(now, days);
  return db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), gte(clicks.createdAt, since)))
    .orderBy(clicks.createdAt, clicks.id)
    .limit(EXPORT_LIMIT)
    .all();
}

export function linkStats(
  db: Db,
  linkId: number,
  { days, now = new Date(), includeBots = false }: StatsOptions,
) {
  const today = startOfUtcDay(now);
  const since = windowStart(now, days);
  const range = and(eq(clicks.linkId, linkId), gte(clicks.createdAt, since));
  const inRange = includeBots ? range : and(range, eq(clicks.isBot, false));
  const bots = db
    .select({ n: count() })
    .from(clicks)
    .where(and(range, eq(clicks.isBot, true)))
    .get()?.n;

  const total = db.select({ n: count() }).from(clicks).where(inRange).get()?.n ?? 0;
  const perDay = new Map(
    db
      .select({ day: dayOf, n: count() })
      .from(clicks)
      .where(inRange)
      .groupBy(dayOf)
      .all()
      .map((row) => [row.day, row.n]),
  );

  const byDay: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDay(addDays(today, -i));
    byDay.push({ date, clicks: perDay.get(date) ?? 0 });
  }

  // UTC hours; the dashboard shifts them into the viewer's timezone.
  const byHour = Array.from({ length: 24 }, () => 0);
  for (const row of db
    .select({ hour: hourOf, n: count() })
    .from(clicks)
    .where(inRange)
    .groupBy(hourOf)
    .all()) {
    byHour[Number(row.hour)] = row.n;
  }

  return {
    range: { days, from: byDay[0]?.date, to: byDay.at(-1)?.date },
    total,
    bots: bots ?? 0,
    includeBots,
    byDay,
    byHour,
    referrers: breakdown(db, inRange, clicks.referrerHost, 'Direct'),
    devices: breakdown(db, inRange, clicks.device, 'unknown'),
    browsers: breakdown(db, inRange, clicks.browser, 'Unknown'),
    os: breakdown(db, inRange, clicks.os, 'Unknown'),
    countries: breakdown(db, inRange, clicks.country, 'Unknown'),
  };
}
