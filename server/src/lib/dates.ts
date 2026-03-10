export const DAY_MS = 86_400_000;

/** Midnight UTC of the day `date` falls on. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses an expiry sent by a client: either a full ISO timestamp or a
 * plain YYYY-MM-DD date from a date picker. Returns null when invalid.
 */
export function parseExpiry(value: string): Date | null {
  const trimmed = value.trim();
  if (!DATE_ONLY.test(trimmed) && Number.isNaN(Date.parse(trimmed))) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** YYYY-MM-DD in UTC. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
