import { Hono } from 'hono';
import QRCode from 'qrcode';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { validate } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { getOwnLink } from '../services/links.js';
import type { AppEnv } from '../types.js';

const params = z.object({ id: z.coerce.number().int().positive() });
const query = z.object({
  format: z.enum(['svg', 'png']).default('svg'),
  size: z.coerce.number().int().min(128).max(1024).default(256),
  download: z.enum(['0', '1']).default('0'),
});

export function qrRoutes({ db, config }: AppDeps) {
  const r = new Hono<AppEnv>();
  r.use('*', requireUser(db));

  r.get('/:id/qr', validate('param', params), validate('query', query), async (c) => {
    const link = getOwnLink(db, c.get('user').id, c.req.valid('param').id);
    const { format, size, download } = c.req.valid('query');
    const text = `${config.baseUrl}/${link.slug}`;
    const options = { width: size, margin: 2, errorCorrectionLevel: 'M' as const };

    c.header('Cache-Control', 'private, max-age=300');
    if (download === '1') {
      c.header('Content-Disposition', `attachment; filename="${link.slug}-qr.${format}"`);
    }
    if (format === 'png') {
      const png = await QRCode.toBuffer(text, { ...options, type: 'png' });
      c.header('Content-Type', 'image/png');
      return c.body(new Uint8Array(png));
    }
    const svg = await QRCode.toString(text, { ...options, type: 'svg' });
    c.header('Content-Type', 'image/svg+xml');
    return c.body(svg);
  });

  return r;
}
