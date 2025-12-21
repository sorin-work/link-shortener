import { describe, expect, it } from 'vitest';
import { referrerHost } from './referrer.js';

describe('referrerHost', () => {
  it.each([
    ['https://www.google.com/search?q=x', 'google.com'],
    ['https://news.ycombinator.com/item?id=1', 'news.ycombinator.com'],
    ['https://t.co/abc123', 'x.com'],
    ['https://l.facebook.com/l.php?u=x', 'facebook.com'],
    ['android-app://com.google.android.gm/', 'mail.google.com'],
    ['HTTPS://WWW.Example.COM/', 'example.com'],
  ])('%s -> %s', (input, host) => {
    expect(referrerHost(input)).toBe(host);
  });

  it('returns null for direct and garbage referrers', () => {
    expect(referrerHost(undefined)).toBeNull();
    expect(referrerHost('')).toBeNull();
    expect(referrerHost('not a url')).toBeNull();
  });
});
