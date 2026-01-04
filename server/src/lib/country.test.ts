import { describe, expect, it } from 'vitest';
import { normalizeCountry } from './country.js';

describe('normalizeCountry', () => {
  it('accepts two letter codes in any case', () => {
    expect(normalizeCountry('DE')).toBe('DE');
    expect(normalizeCountry(' ro ')).toBe('RO');
  });

  it('drops placeholders and junk', () => {
    for (const value of [undefined, null, '', 'XX', 'T1', 'USA', '1A', 'd']) {
      expect(normalizeCountry(value)).toBeNull();
    }
  });
});
