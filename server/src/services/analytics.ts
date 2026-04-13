import { and, count, desc, eq, gte, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { Db } from '../db/client.js';
import { clicks } from '../db/schema.js';
import { addDays, isoDay, startOfUtcDay } from '../lib/dates.js';

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

export function linkStats(
  db: Db,
  linkId: number,
  { days, now = new Date(), includeBots = false }: StatsOptions,
) {
  const today = startOfUtcDay(now);
  const since = addDays(today, -days);
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
  for (let i = days; i >= 1; i--) {
    const date = isoDay(addDays(today, -i));
    byDay.push({ date, clicks: perDay.get(date) ?? 0 });
  }

  return {
    range: { days, from: byDay[0]?.date, to: byDay.at(-1)?.date },
    total,
    bots: bots ?? 0,
    includeBots,
    byDay,
    referrers: breakdown(db, inRange, clicks.referrerHost, 'Direct'),
    devices: breakdown(db, inRange, clicks.device, 'unknown'),
    browsers: breakdown(db, inRange, clicks.browser, 'Unknown'),
    os: breakdown(db, inRange, clicks.os, 'Unknown'),
    countries: breakdown(db, inRange, clicks.country, 'Unknown'),
  };
}
