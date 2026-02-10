export const DAY_MS = 86_400_000;

/** Midnight UTC of the day `date` falls on. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** YYYY-MM-DD in UTC. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
