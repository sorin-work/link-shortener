import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db/client.js';

const config = loadConfig();
const db = openDatabase(config.databasePath, config.migrationsDir);
const app = createApp({ db, config });

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`link-shortener listening on http://localhost:${info.port}`);
});
