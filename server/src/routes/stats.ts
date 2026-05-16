import { eq } from 'drizzle-orm';
import { toCsv } from '../lib/csv.js';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { links } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { clicksForExport, linkStats } from '../services/analytics.js';
import { getOwnLink } from '../services/links.js';
import type { AppEnv } from '../types.js';

const params = z.object({ id: z.coerce.number().int().positive() });
const query = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  bots: z.enum(['include', 'exclude']).default('exclude'),
});

export function statsRoutes({ db }: AppDeps) {
  const r = new Hono<AppEnv>();
  r.use('*', requireUser(db, { allowApiKey: true }));

  r.get('/:id/stats', validate('param', params), validate('query', query), (c) => {
    const { id } = c.req.valid('param');
    const link = db.select().from(links).where(eq(links.id, id)).get();
    if (!link) throw notFound('Link not found');
    const { days, bots } = c.req.valid('query');
    return c.json(linkStats(db, link.id, { days, includeBots: bots === 'include' }));
  });

  r.get('/:id/clicks.csv', validate('param', params), validate('query', query), (c) => {
    const link = getOwnLink(db, c.get('user').id, c.req.valid('param').id);
    const { days } = c.req.valid('query');
    const rows = clicksForExport(db, link.id, { days }).map((click) => [
      click.createdAt.toISOString(),
      click.referrer,
      click.referrerHost,
      click.country,
      click.device,
      click.browser,
      click.os,
      click.isBot ? 'yes' : 'no',
      click.userAgent,
    ]);
    const csv = toCsv(
      [
        'time',
        'referrer',
        'referrer_host',
        'country',
        'device',
        'browser',
        'os',
        'bot',
        'user_agent',
      ],
      rows,
    );
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${link.slug}-clicks.csv"`);
    return c.body(csv);
  });

  return r;
}
