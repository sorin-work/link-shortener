import { describe, expect, it } from 'vitest';
import { addDays, isoDay, startOfUtcDay } from './dates.js';

describe('date helpers', () => {
  it('finds the start of the utc day', () => {
    expect(startOfUtcDay(new Date('2026-02-01T23:59:59.999Z')).toISOString()).toBe(
      '2026-02-01T00:00:00.000Z',
    );
  });

  it('adds and subtracts days across month and year boundaries', () => {
    expect(isoDay(addDays(new Date('2026-02-28T10:00:00Z'), 1))).toBe('2026-03-01');
    expect(isoDay(addDays(new Date('2026-01-01T10:00:00Z'), -1))).toBe('2025-12-31');
  });

  it('formats utc days regardless of the local timezone', () => {
    expect(isoDay(new Date('2026-03-29T00:30:00+02:00'))).toBe('2026-03-28');
  });
});
