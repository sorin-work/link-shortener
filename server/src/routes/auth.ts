import { eq } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import type { AppDeps } from '../app.js';
import { users, type User } from '../db/schema.js';
import { requireUser } from '../middleware/auth.js';
import { conflict, HttpError, unauthorized } from '../lib/errors.js';
import { clientIp } from '../lib/clientIp.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createRateLimiter } from '../lib/rateLimit.js';
import { createSession, deleteSession, SESSION_COOKIE } from '../lib/sessions.js';
import { validate } from '../lib/validate.js';
import type { AppEnv } from '../types.js';

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'));

const registerSchema = z.object({
  email,
  name: z.string().trim().min(1, 'Name is required').max(80),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(200),
});

// Verified against when the email is unknown so both paths take about as long.
const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export function authRoutes({ db, config }: AppDeps) {
  const r = new Hono<AppEnv>();
  const attempts = createRateLimiter({ windowMs: 15 * 60_000, max: 20 });

  const throttle = (c: Context, action: string) => {
    const result = attempts.hit(`${action}:${clientIp(c, config.trustProxy)}`);
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfter));
      throw new HttpError(429, 'Too many attempts, try again later', 'rate_limited');
    }
  };

  const startSession = (c: Context, userId: number) => {
    const { token, expiresAt } = createSession(db, userId, config.sessionTtlDays);
    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: config.secureCookies,
      path: '/',
      expires: expiresAt,
    });
  };

  r.post('/register', validate('json', registerSchema), async (c) => {
    throttle(c, 'register');
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
    startSession(c, user.id);
    return c.json({ user: publicUser(user) }, 201);
  });

  r.post('/login', validate('json', loginSchema), async (c) => {
    throttle(c, 'login');
    const { email, password } = c.req.valid('json');
    const user = db.select().from(users).where(eq(users.email, email)).get();
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw unauthorized('Email or password is incorrect');
    startSession(c, user.id);
    return c.json({ user: publicUser(user) });
  });

  r.post('/logout', (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (token) deleteSession(db, token);
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return c.body(null, 204);
  });

  r.get('/me', requireUser(db), (c) => c.json({ user: publicUser(c.get('user')) }));

  return r;
}
