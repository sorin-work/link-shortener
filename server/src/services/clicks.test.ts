import { describe, expect, it } from 'vitest';
import { clicks, links, users } from '../db/schema.js';
import { setup } from '../test/helpers.js';
import { clickSummaries } from './clicks.js';

describe('clickSummaries', () => {
  it('counts human clicks per link in one go', () => {
    const { db } = setup();
    const user = db
      .insert(users)
      .values({ email: 'a@example.com', name: 'A', passwordHash: 'x' })
      .returning()
      .get();
    const [a, b, c] = ['aaa', 'bbb', 'ccc'].map(
      (slug) =>
        db
          .insert(links)
          .values({ userId: user.id, slug, url: 'https://x.example' })
          .returning()
          .get().id,
    );
    db.insert(clicks)
      .values([
        { linkId: a!, isBot: false, createdAt: new Date('2026-06-01T10:00:00Z') },
        { linkId: a!, isBot: false, createdAt: new Date('2026-06-02T10:00:00Z') },
        { linkId: a!, isBot: true, createdAt: new Date('2026-06-03T10:00:00Z') },
        { linkId: b!, isBot: false },
      ])
      .run();
    const summaries = clickSummaries(db, [a!, b!, c!]);
    expect(summaries.get(a!)).toEqual({
      clicks: 2,
      lastClickAt: new Date('2026-06-02T10:00:00Z'),
    });
    expect(summaries.get(b!)?.clicks).toBe(1);
    expect(summaries.get(c!)).toBeUndefined();
    expect(clickSummaries(db, []).size).toBe(0);
  });
});
