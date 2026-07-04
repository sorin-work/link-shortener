import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db/client.js';
import { pruneExpiredSessions } from './lib/sessions.js';
import { DEMO_EMAIL, DEMO_PASSWORD, seedDemo } from './seed.js';

const config = loadConfig();
const db = openDatabase(config.databasePath, config.migrationsDir);
if (config.seedDemo && (await seedDemo(db))) {
  console.log(`Created demo account ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}
const app = createApp({ db, config });

const pruneTimer = setInterval(() => pruneExpiredSessions(db), 60 * 60_000);
pruneTimer.unref();

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`link-shortener listening on http://localhost:${info.port}`);
});

// docker stop sends SIGTERM; finish in-flight requests and close the database.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  clearInterval(pruneTimer);
  server.close(() => {
    db.$client.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
