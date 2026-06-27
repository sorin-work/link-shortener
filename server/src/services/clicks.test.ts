import { describe, expect, it } from 'vitest';
import { clicks, links, users } from '../db/schema.js';
import { setup } from '../test/helpers.js';
import { countClicksFor } from './clicks.js';

describe('countClicksFor', () => {
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
        { linkId: a!, isBot: false },
        { linkId: a!, isBot: false },
        { linkId: a!, isBot: true },
        { linkId: b!, isBot: false },
      ])
      .run();
    const counts = countClicksFor(db, [a!, b!, c!]);
    expect(counts.get(a!)).toBe(2);
    expect(counts.get(b!)).toBe(1);
    expect(counts.get(c!)).toBeUndefined();
    expect(countClicksFor(db, []).size).toBe(0);
  });
});
