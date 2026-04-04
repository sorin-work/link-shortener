import path from 'node:path';

export interface Config {
  port: number;
  databasePath: string;
  migrationsDir: string;
  /** Built dashboard (vite output). Not served when missing. */
  webDir: string;
  /** Public origin used to build short URLs, without a trailing slash. */
  baseUrl: string;
  sessionTtlDays: number;
  secureCookies: boolean;
  /** Request header a CDN or proxy puts the visitor's country code in. */
  countryHeader: string;
  /** Trust X-Forwarded-For (set when running behind a reverse proxy). */
  trustProxy: boolean;
  /** Create the demo account with sample data on start. */
  seedDemo: boolean;
}

function intFrom(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a non-negative integer`);
  return n;
}

function boolFrom(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = intFrom(env.PORT, 3000, 'PORT');
  const baseUrl = (env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '');
  return {
    port,
    databasePath: env.DATABASE_PATH || path.resolve('data/links.db'),
    migrationsDir: env.MIGRATIONS_DIR || path.resolve('server/drizzle'),
    webDir: env.WEB_DIR || path.resolve('dist/web'),
    baseUrl,
    sessionTtlDays: intFrom(env.SESSION_TTL_DAYS, 30, 'SESSION_TTL_DAYS'),
    secureCookies: boolFrom(env.SECURE_COOKIES, baseUrl.startsWith('https://')),
    countryHeader: (env.COUNTRY_HEADER || 'cf-ipcountry').toLowerCase(),
    trustProxy: boolFrom(env.TRUST_PROXY, false),
    seedDemo: boolFrom(env.SEED_DEMO, false),
  };
}
