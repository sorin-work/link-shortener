import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { authRoutes } from './routes/auth.js';
import { linkRoutes } from './routes/links.js';
import { redirectRoutes } from './routes/redirect.js';

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

  app.route('/api/auth', authRoutes(deps));
  app.route('/api/links', linkRoutes(deps));

  // Must stay last: it matches any single path segment.
  app.route('/', redirectRoutes(deps));

  return app;
}
