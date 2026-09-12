# Architecture

One Node process serves everything:

```
browser ──▶ Hono app (server/src/app.ts)
             ├─ /api/*        JSON API (sessions or api keys)
             ├─ /app/*        built Preact dashboard (dist/web), SPA fallback
             ├─ /robots.txt
             └─ /:slug        redirects, unlock form, 404/410 pages
                    │
                    ▼
             SQLite (better-sqlite3 + Drizzle), WAL mode
```

## Server

| Path                      | What lives there                                           |
| ------------------------- | ---------------------------------------------------------- |
| `server/src/app.ts`       | builds the Hono app from `{ db, config }`; used by tests   |
| `server/src/index.ts`     | process entry: config, migrations, demo seed, timers       |
| `server/src/routes/`      | one file per area (auth, links, stats, qr, keys, redirect) |
| `server/src/services/`    | queries shared between routes (links, clicks, analytics)   |
| `server/src/lib/`         | pure helpers: slugs, urls, user agents, csv, dates, ...    |
| `server/src/db/schema.ts` | Drizzle schema; `npm run db:generate` writes migrations    |
| `server/drizzle/`         | SQL migrations, applied on start                           |

`createApp` takes its dependencies as arguments, so every API test gets its
own in-memory SQLite database with all migrations applied (see
`server/src/test/helpers.ts`).

### Redirect path

`GET /:slug` is the hot path. It does one indexed lookup, checks
`availability()` (paused, expired, click limit), inserts one row into
`clicks` and, for human visitors, bumps `links.click_count`. User agent,
referrer and country are parsed once at insert time so the stats queries
are plain `GROUP BY`s.

## Web

`web/` is a Vite + Preact app served under `/app/`. There is no state
library: pages load what they need through `web/src/api.ts`, the session
lives in `auth.tsx`, and routing is a 60-line history router in
`router.tsx`.

## Data model

```
users ─┬─< sessions
       ├─< api_keys
       └─< links ─< clicks
```

Deleting a user or a link cascades to everything below it.
