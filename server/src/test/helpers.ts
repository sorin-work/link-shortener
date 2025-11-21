import { createApp } from '../app.js';
import { loadConfig, type Config } from '../config.js';
import { openDatabase } from '../db/client.js';

export function setup(overrides: Partial<Config> = {}) {
  const config: Config = {
    ...loadConfig({ BASE_URL: 'http://sho.rt' }),
    databasePath: ':memory:',
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

// Response bodies in tests are loosely typed on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readJson = (res: Response): Promise<any> => res.json();
