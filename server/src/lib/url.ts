const MAX_URL_LENGTH = 2048;

export type DestinationResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Normalises a destination URL typed by a user. Bare hosts get https://,
 * anything that is not http(s) is refused, and links back to the shortener
 * itself are refused so a slug can't redirect to itself forever.
 */
export function normalizeDestination(input: string, ownOrigin?: string): DestinationResult {
  let raw = input.trim();
  if (!raw) return { ok: false, error: 'URL is required' };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'Enter a valid URL' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https links can be shortened' };
  }
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    return { ok: false, error: 'Enter a valid URL' };
  }
  if (ownOrigin && parsed.origin === new URL(ownOrigin).origin) {
    return { ok: false, error: 'That URL is already a short link' };
  }
  const url = parsed.toString();
  if (url.length > MAX_URL_LENGTH) return { ok: false, error: 'URL is too long' };
  return { ok: true, url };
}
