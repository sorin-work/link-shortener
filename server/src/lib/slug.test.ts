import { describe, expect, it } from 'vitest';
import { checkCustomSlug, generateSlug, GENERATED_SLUG_LENGTH } from './slug.js';

describe('generateSlug', () => {
  it('produces slugs of the requested length from the safe alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug();
      expect(slug).toHaveLength(GENERATED_SLUG_LENGTH);
      expect(slug).toMatch(/^[2-9a-hjkmnp-z]+$/);
    }
    expect(generateSlug(12)).toHaveLength(12);
  });

  it('rarely repeats', () => {
    const seen = new Set(Array.from({ length: 1000 }, () => generateSlug()));
    expect(seen.size).toBe(1000);
  });
});

describe('checkCustomSlug', () => {
  it.each(['abc', 'spring-sale', 'Q4_report', 'a1b2c3'])('accepts %s', (slug) => {
    expect(checkCustomSlug(slug)).toBeNull();
  });

  it.each([
    ['ab', /at least 3/],
    ['x'.repeat(65), /at most 64/],
    ['-abc', /may only contain/],
    ['abc-', /may only contain/],
    ['has space', /may only contain/],
    ['café', /may only contain/],
    ['api', /reserved/],
    ['Health', /reserved/],
  ])('rejects %s', (slug, message) => {
    expect(checkCustomSlug(slug)).toMatch(message);
  });
});
