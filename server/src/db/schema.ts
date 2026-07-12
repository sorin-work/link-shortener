import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: createdAt(),
});

export const sessions = sqliteTable('sessions', {
  /** sha256 of the cookie token, so a leaked database cannot be replayed */
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: createdAt(),
});

export const links = sqliteTable(
  'links',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    url: text('url').notNull(),
    title: text('title'),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    maxClicks: integer('max_clicks'),
    /** Clicks that count towards max_clicks. */
    clickCount: integer('click_count').notNull().default(0),
    passwordHash: text('password_hash'),
    paused: integer('paused', { mode: 'boolean' }).notNull().default(false),
    tags: text('tags', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    createdAt: createdAt(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('links_slug_unique').on(t.slug), index('links_user_idx').on(t.userId)],
);

export const clicks = sqliteTable(
  'clicks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    linkId: integer('link_id')
      .notNull()
      .references(() => links.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    referrer: text('referrer'),
    referrerHost: text('referrer_host'),
    userAgent: text('user_agent'),
    device: text('device').notNull().default('unknown'),
    browser: text('browser').notNull().default('Unknown'),
    os: text('os').notNull().default('Unknown'),
    country: text('country'),
    isBot: integer('is_bot', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [index('clicks_link_created_idx').on(t.linkId, t.createdAt)],
);

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** first characters of the key, shown so people can tell keys apart */
    prefix: text('prefix').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    createdAt: createdAt(),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  },
  (t) => [index('api_keys_user_idx').on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Click = typeof clicks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
