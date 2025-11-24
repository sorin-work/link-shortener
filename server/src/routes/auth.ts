import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { users, type User } from '../db/schema.js';
import { conflict } from '../lib/errors.js';
import { hashPassword } from '../lib/password.js';
import { validate } from '../lib/validate.js';

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'));

const registerSchema = z.object({
  email,
  name: z.string().trim().min(1, 'Name is required').max(80),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export function authRoutes({ db }: AppDeps) {
  const r = new Hono();

  r.post('/register', validate('json', registerSchema), async (c) => {
    const input = c.req.valid('json');
    const existing = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .get();
    if (existing) throw conflict('An account with this email already exists');

    const user = db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      })
      .returning()
      .get();
    return c.json({ user: publicUser(user) }, 201);
  });

  return r;
}
