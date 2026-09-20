import 'dotenv/config';
import { loadConfig } from '../config.js';
import { openDatabase } from '../db/client.js';
import { DEMO_EMAIL, DEMO_PASSWORD, seedDemo } from '../seed.js';

const config = loadConfig();
const db = openDatabase(config.databasePath, config.migrationsDir);
if (await seedDemo(db)) {
  console.log(`Created ${DEMO_EMAIL} / ${DEMO_PASSWORD} in ${config.databasePath}`);
} else {
  console.log(`${DEMO_EMAIL} already exists in ${config.databasePath}, nothing to do`);
}
db.$client.close();
