import { and, count, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { clicks } from '../db/schema.js';

const DAY_MS = 86_400_000;

export interface StatsOptions {
  days: number;
  now?: Date;
}

export interface DayCount {
  date: string;
  clicks: number;
}

const dayOf = sql<string>`strftime('%Y-%m-%d', ${clicks.createdAt} / 1000, 'unixepoch')`;

export function linkStats(db: Db, linkId: number, { days, now = new Date() }: StatsOptions) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const since = new Date(today - days * DAY_MS);
  const inRange = and(eq(clicks.linkId, linkId), gte(clicks.createdAt, since));

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
    const date = new Date(today - i * DAY_MS).toISOString().slice(0, 10);
    byDay.push({ date, clicks: perDay.get(date) ?? 0 });
  }

  return {
    range: { days, from: byDay[0]?.date, to: byDay.at(-1)?.date },
    total,
    byDay,
  };
}
