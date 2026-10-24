import { describe, expect, it } from 'vitest';
import { displayUrl, formatNumber, timeAgo, todayIso } from './format';

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-01-20T12:00:00Z');
  const ago = (ms: number) => timeAgo(new Date(now - ms).toISOString(), now);

  it.each([
    [10_000, 'just now'],
    [5 * 60_000, '5 min ago'],
    [3 * 3_600_000, '3 h ago'],
    [26 * 3_600_000, 'yesterday'],
    [6 * 86_400_000, '6 days ago'],
  ])('%i ms -> %s', (ms, text) => {
    expect(ago(ms)).toBe(text);
  });

  it('falls back to a date for old entries', () => {
    expect(ago(90 * 86_400_000)).toBe('Oct 22, 2025');
  });
});

describe('todayIso', () => {
  it('uses the local calendar date', () => {
    const lateEvening = new Date(2026, 9, 31, 23, 30);
    expect(todayIso(lateEvening)).toBe('2026-10-31');
    expect(todayIso(new Date(2026, 0, 5, 0, 15))).toBe('2026-01-05');
  });
});

describe('displayUrl', () => {
  it('drops the scheme and a bare slash', () => {
    expect(displayUrl('https://example.com/')).toBe('example.com');
    expect(displayUrl('https://example.com/a/b?c=1')).toBe('example.com/a/b?c=1');
  });

  it('returns unparseable input as is', () => {
    expect(displayUrl('not a url')).toBe('not a url');
  });
});
