// Placeholder codes some proxies send: XX = unknown, T1 = Tor (Cloudflare), A1/A2 = anonymiser/satellite.
const NOT_A_COUNTRY = new Set(['XX', 'T1', 'A1', 'A2', 'ZZ']);

/** Turns a geo header value into an ISO 3166-1 alpha-2 code, or null. */
export function normalizeCountry(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code) || NOT_A_COUNTRY.has(code)) return null;
  return code;
}
