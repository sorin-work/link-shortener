export const DAY_MS = 86_400_000;

/** Midnight UTC of the day `date` falls on. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Start of a window of `days` UTC days that ends with (and includes) today. */
export function windowStart(now: Date, days: number): Date {
  return addDays(startOfUtcDay(now), -(days - 1));
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses an expiry sent by a client: either a full ISO timestamp or a
 * plain YYYY-MM-DD date from a date picker. Returns null when invalid.
 */
export function parseExpiry(value: string): Date | null {
  const trimmed = value.trim();
  if (!DATE_ONLY.test(trimmed) && Number.isNaN(Date.parse(trimmed))) return null;
  // A date from a date picker means "until the end of that day".
  const date = new Date(DATE_ONLY.test(trimmed) ? `${trimmed}T23:59:59.999Z` : trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** YYYY-MM-DD in UTC. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
