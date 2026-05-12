import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { apiKeyRoutes } from './routes/apiKeys.js';
import { authRoutes } from './routes/auth.js';
import { linkRoutes } from './routes/links.js';
import { qrRoutes } from './routes/qr.js';
import { redirectRoutes } from './routes/redirect.js';
import { statsRoutes } from './routes/stats.js';
import { mountWeb } from './static.js';

export interface AppDeps {
  db: Db;
  config: Config;
}

export function createApp(deps: AppDeps) {
  const { db } = deps;
  const app = new Hono();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  if (deps.config.logRequests) app.use('*', logger());
  app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
    }),
  );

  app.get('/api/health', (c) => {
    db.get(sql`select 1`);
    return c.json({ status: 'ok' });
  });

  app.route('/api/auth', authRoutes(deps));
  app.route('/api/keys', apiKeyRoutes(deps));
  app.route('/api/links', linkRoutes(deps));
  app.route('/api/links', statsRoutes(deps));
  app.route('/api/links', qrRoutes(deps));

  mountWeb(app, deps.config.webDir);

  // Must stay last: it matches any single path segment.
  app.route('/', redirectRoutes(deps));

  return app;
}
