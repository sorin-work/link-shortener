import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';

export interface AppDeps {
  db: Db;
  config: Config;
}

export function createApp(deps: AppDeps) {
  const { db } = deps;
  const app = new Hono();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  app.get('/api/health', (c) => {
    db.get(sql`select 1`);
    return c.json({ status: 'ok' });
  });

  return app;
}
