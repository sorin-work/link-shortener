import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { links } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { linkStats } from '../services/analytics.js';
import type { AppEnv } from '../types.js';

const params = z.object({ id: z.coerce.number().int().positive() });
const query = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  bots: z.enum(['include', 'exclude']).default('exclude'),
});

export function statsRoutes({ db }: AppDeps) {
  const r = new Hono<AppEnv>();
  r.use('*', requireUser(db));

  r.get('/:id/stats', validate('param', params), validate('query', query), (c) => {
    const { id } = c.req.valid('param');
    const link = db.select().from(links).where(eq(links.id, id)).get();
    if (!link) throw notFound('Link not found');
    const { days, bots } = c.req.valid('query');
    return c.json(linkStats(db, link.id, { days, includeBots: bots === 'include' }));
  });

  return r;
}
