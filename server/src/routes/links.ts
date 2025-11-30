import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { links } from '../db/schema.js';
import { badRequest, conflict } from '../lib/errors.js';
import { checkCustomSlug } from '../lib/slug.js';
import { validate } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { serializeLink, slugTaken, uniqueSlug } from '../services/links.js';
import type { AppEnv } from '../types.js';

const createSchema = z.object({
  url: z.url('Enter a valid URL').max(2048),
  slug: z.string().trim().optional(),
  title: z.string().trim().max(200).optional(),
});

export function linkRoutes({ db, config }: AppDeps) {
  const r = new Hono<AppEnv>();
  r.use('*', requireUser(db));

  r.post('/', validate('json', createSchema), (c) => {
    const input = c.req.valid('json');
    let slug: string;
    if (input.slug) {
      const problem = checkCustomSlug(input.slug);
      if (problem) throw badRequest(problem, [{ path: 'slug', message: problem }]);
      if (slugTaken(db, input.slug)) throw conflict(`The slug "${input.slug}" is already taken`);
      slug = input.slug;
    } else {
      slug = uniqueSlug(db);
    }

    const link = db
      .insert(links)
      .values({ userId: c.get('user').id, slug, url: input.url, title: input.title || null })
      .returning()
      .get();
    return c.json({ link: serializeLink(link, config) }, 201);
  });

  return r;
}
