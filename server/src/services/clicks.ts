import type { Db } from '../db/client.js';
import { clicks, type Link } from '../db/schema.js';
import { parseUserAgent } from '../lib/useragent.js';

export interface ClickInfo {
  referrer?: string | null;
  userAgent?: string | null;
  at?: Date;
}

const clip = (value: string | null | undefined, max: number) =>
  value ? value.slice(0, max) : null;

export function recordClick(db: Db, link: Link, info: ClickInfo) {
  db.insert(clicks)
    .values({
      linkId: link.id,
      createdAt: info.at ?? new Date(),
      referrer: clip(info.referrer, 1024),
      userAgent: clip(info.userAgent, 512),
      ...parseUserAgent(info.userAgent),
    })
    .run();
}
