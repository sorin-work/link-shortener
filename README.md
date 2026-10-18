# link-shortener

Self-hosted short links with click analytics. One Node process, one SQLite
file, a small Preact dashboard and a JSON API.

## Features

- **Short links** with generated (`/k7m2qpz`) or custom slugs (`/spring-sale`),
  case-insensitive and reserved-word aware
- **Expiry dates and click limits**: links answer `410 Gone` afterwards
- **Password-protected links** with a small unlock page and attempt limits
- **Pause and resume** a link without deleting its history
- **Tags**, search, sorting and bulk delete in the dashboard
- **UTM builder** for campaign parameters on the destination URL
- **QR codes** as SVG or PNG in three sizes
- **Click analytics**: clicks per day and hour, referrers, devices, browsers,
  operating systems and countries (from a CDN header)
- **Bot filtering**: crawlers and chat app link previews are recorded but kept
  out of the numbers and never use up a click limit
- **CSV export** of a link's clicks and of all links
- **API keys** for creating and reading links from scripts
- Accounts with sessions, password change and account deletion

## Quick start with Docker

```bash
docker compose up --build
```

Open http://localhost:4415 and sign in with the demo account:

- **Email:** `demo@example.com`
- **Password:** `demo-password`

The demo account is created on first start with a dozen links, three months
of clicks (including some bot traffic), an expired link, a click-limited link,
a paused link and a password-protected one (password `demo`). Set
`SEED_DEMO=false` to start empty.

The SQLite database lives in the `data` volume; `docker compose down -v`
removes it. Use `WEB_PORT=8080 docker compose up` to pick another port, and set
`BASE_URL` to the public origin when you put it behind a domain.

## Local development

You need Node 22 or newer.

```bash
npm install
npm run seed   # optional: demo@example.com / demo-password
npm run dev
```

This starts the API on http://localhost:3000 and the dashboard on
http://localhost:5173/app/ (Vite proxies `/api` to the API). Short links are
served by the API, e.g. http://localhost:3000/launch.

The database is created at `data/links.db` and migrations run on start. After
changing `server/src/db/schema.ts` run `npm run db:generate` to write a new
migration.

## Configuration

All settings are environment variables (a `.env` file works in development,
see `.env.example`).

| Variable           | Default                    | Description                                       |
| ------------------ | -------------------------- | ------------------------------------------------- |
| `PORT`             | `3000`                     | HTTP port of the API and dashboard                |
| `BASE_URL`         | `http://localhost:$PORT`   | Public origin used to build short URLs            |
| `DATABASE_PATH`    | `data/links.db`            | SQLite file, created if missing                   |
| `MIGRATIONS_DIR`   | `server/drizzle`           | Drizzle migrations, applied on start              |
| `WEB_DIR`          | `dist/web`                 | Built dashboard; not served when missing          |
| `SESSION_TTL_DAYS` | `30`                       | How long a sign-in lasts                          |
| `SECURE_COOKIES`   | on for an https `BASE_URL` | Mark the session cookie `Secure`                  |
| `COUNTRY_HEADER`   | `cf-ipcountry`             | Request header with the visitor's country code    |
| `TRUST_PROXY`      | `false`                    | Trust `X-Forwarded-For` for rate limiting         |
| `LOG_REQUESTS`     | `true`                     | Log one line per request                          |
| `SEED_DEMO`        | `false` (`true` in Docker) | Create the demo account with sample data on start |

In Docker, `WEB_PORT` (default `4415`) picks the published port.

## Tests

```bash
npm test               # server and web tests
npm run test:coverage  # with a v8 coverage report in coverage/
```

API tests run against a fresh in-memory SQLite database per test with all
migrations applied; web tests use jsdom and Testing Library. CI
(`.github/workflows/ci.yml`) runs lint, format check, type check, tests and the
build, then builds the Docker image.

## Scripts

| Command               | What it does                                 |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | API with reload + Vite dev server            |
| `npm test`            | All tests (server and web)                   |
| `npm run lint`        | ESLint                                       |
| `npm run format`      | Prettier                                     |
| `npm run typecheck`   | TypeScript for server and web                |
| `npm run build`       | Compile the API and build the dashboard      |
| `npm start`           | Run the built app (serves the dashboard too) |
| `npm run seed`        | Create the demo account in the local db      |
| `npm run db:generate` | Write a migration after a schema change      |

## Project layout

```
server/
  src/
    app.ts            Hono app factory (used by index.ts and the tests)
    index.ts          entry point: config, migrations, seed, shutdown
    routes/           auth, links, stats, qr, api keys, redirects
    services/         link, click and analytics queries
    lib/              slugs, urls, user agents, bots, csv, dates, rate limits
    db/schema.ts      Drizzle schema
  drizzle/            SQL migrations
web/
  src/
    pages/            links, link detail, api keys, settings, sign in
    components/       forms, charts, badges, QR panel, UTM builder
    api.ts            typed fetch client
docs/                 API reference, architecture, analytics notes
```

More detail in [docs/api.md](docs/api.md), [docs/architecture.md](docs/architecture.md)
and [docs/analytics.md](docs/analytics.md).

## License

[MIT](LICENSE)
