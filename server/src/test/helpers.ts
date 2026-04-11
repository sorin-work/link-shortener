import { createApp } from '../app.js';
import { loadConfig, type Config } from '../config.js';
import { openDatabase } from '../db/client.js';

export function setup(overrides: Partial<Config> = {}) {
  const config: Config = {
    ...loadConfig({ BASE_URL: 'http://sho.rt' }),
    databasePath: ':memory:',
    logRequests: false,
    ...overrides,
  };
  const db = openDatabase(':memory:', config.migrationsDir);
  const app = createApp({ db, config });
  return { app, db, config };
}

export type TestApp = ReturnType<typeof setup>['app'];

interface RequestOptions {
  json?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
}

export function call(app: TestApp, method: string, path: string, opts: RequestOptions = {}) {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.cookie) headers.cookie = opts.cookie;
  let body: string | undefined;
  if (opts.json !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(opts.json);
  }
  return app.request(path, { method, headers, body });
}

export function sessionCookie(res: Response): string {
  const header = res.headers.get('set-cookie');
  if (!header) throw new Error('response did not set a cookie');
  return header.split(';')[0]!;
}

let userCounter = 0;

/** Registers a fresh user and returns its session cookie. */
export async function registerUser(app: TestApp, email = `user${++userCounter}@example.com`) {
  const res = await call(app, 'POST', '/api/auth/register', {
    json: { email, name: 'Test User', password: 'correct-horse' },
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.status}`);
  return sessionCookie(res);
}

export async function createLink(app: TestApp, cookie: string, json: Record<string, unknown>) {
  const res = await call(app, 'POST', '/api/links', { cookie, json });
  if (res.status !== 201) throw new Error(`create link failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { link: { id: number; slug: string; url: string } };
}

// Response bodies in tests are loosely typed on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readJson = (res: Response): Promise<any> => res.json();
