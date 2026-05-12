import { and, desc, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { apiKeys, type ApiKey } from '../db/schema.js';
import { generateApiKey } from '../lib/apiKeys.js';
import { badRequest, notFound } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

const MAX_ACTIVE_KEYS = 20;

const createSchema = z.object({ name: z.string().trim().min(1, 'Name is required').max(60) });
const idParam = z.object({ id: z.coerce.number().int().positive() });

const serializeKey = (key: ApiKey) => ({
  id: key.id,
  name: key.name,
  prefix: key.prefix,
  createdAt: key.createdAt.toISOString(),
  lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
  revokedAt: key.revokedAt?.toISOString() ?? null,
});

export function apiKeyRoutes({ db }: AppDeps) {
  const r = new Hono<AppEnv>();
  // Session only: an api key must not be able to mint more keys.
  r.use('*', requireUser(db));

  r.get('/', (c) => {
    const rows = db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, c.get('user').id))
      .orderBy(desc(apiKeys.createdAt), desc(apiKeys.id))
      .all();
    return c.json({ keys: rows.map(serializeKey) });
  });

  r.post('/', validate('json', createSchema), (c) => {
    const userId = c.get('user').id;
    const active = db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
      .all().length;
    if (active >= MAX_ACTIVE_KEYS) {
      throw badRequest(`You can have at most ${MAX_ACTIVE_KEYS} active keys`);
    }

    const { token, prefix, hash } = generateApiKey();
    const key = db
      .insert(apiKeys)
      .values({ userId, name: c.req.valid('json').name, prefix, keyHash: hash })
      .returning()
      .get();
    return c.json({ key: serializeKey(key), token }, 201);
  });

  r.delete('/:id', validate('param', idParam), (c) => {
    const key = db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, c.req.valid('param').id), eq(apiKeys.userId, c.get('user').id)))
      .get();
    if (!key) throw notFound('API key not found');
    if (!key.revokedAt) {
      db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, key.id)).run();
    }
    return c.body(null, 204);
  });

  return r;
}
