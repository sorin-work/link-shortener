import { describe, expect, it } from 'vitest';
import { normalizeDestination } from './url.js';

const ok = (input: string, origin?: string) => {
  const result = normalizeDestination(input, origin);
  if (!result.ok) throw new Error(result.error);
  return result.url;
};

describe('normalizeDestination', () => {
  it('keeps valid http and https urls', () => {
    expect(ok('https://example.com/a?b=1#c')).toBe('https://example.com/a?b=1#c');
    expect(ok('http://example.com')).toBe('http://example.com/');
  });

  it('adds https to bare hosts and trims whitespace', () => {
    expect(ok('  example.com/path ')).toBe('https://example.com/path');
  });

  it('accepts localhost for local testing', () => {
    expect(ok('http://localhost:8080/x')).toBe('http://localhost:8080/x');
  });

  it('punycodes international domains', () => {
    expect(ok('https://bücher.de')).toBe('https://xn--bcher-kva.de/');
  });

  it.each([
    ['', /required/],
    ['javascript:alert(1)', /Only http/],
    ['data:text/html,hi', /Only http/],
    ['ftp://example.com/file', /Only http/],
    ['https://', /valid URL/],
    ['notaurl', /valid URL/],
  ])('rejects %j', (input, message) => {
    const result = normalizeDestination(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });

  it('refuses links to the shortener itself', () => {
    const result = normalizeDestination('http://sho.rt/abc', 'http://sho.rt');
    expect(result).toEqual({ ok: false, error: 'That URL is already a short link' });
  });

  it('refuses urls longer than 2048 characters', () => {
    const result = normalizeDestination(`https://example.com/${'a'.repeat(2100)}`);
    expect(result.ok).toBe(false);
  });
});
