import { randomInt } from 'node:crypto';

// No 0/o, 1/l/i: generated slugs get read aloud and typed from print.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export const GENERATED_SLUG_LENGTH = 7;

/** Paths the app itself uses; a link with one of these slugs would be unreachable. */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'favicon.ico',
  'health',
  'login',
  'logout',
  'register',
  'robots.txt',
  'static',
]);

const CUSTOM_SLUG = /^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$/;

export function generateSlug(length = GENERATED_SLUG_LENGTH): string {
  let slug = '';
  for (let i = 0; i < length; i++) slug += ALPHABET[randomInt(ALPHABET.length)];
  return slug;
}

/** Returns an error message, or null when the slug can be used. */
export function checkCustomSlug(slug: string): string | null {
  if (slug.length < 3) return 'Slug must be at least 3 characters';
  if (slug.length > 64) return 'Slug must be at most 64 characters';
  if (!CUSTOM_SLUG.test(slug)) {
    return 'Slug may only contain letters, digits, dashes and underscores, and must start and end with a letter or digit';
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return `"${slug}" is reserved`;
  return null;
}
