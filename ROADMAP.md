# Roadmap

Things I might add to link-shortener. The app covers the whole job today
(short links with limits and passwords, QR codes, click analytics with bot
filtering, CSV export, API keys), so nothing here is promised or scheduled.
These are ideas, written down with enough detail that I (or anyone else) can
pick one up later without starting from zero. Items may change, move between
groups or be dropped.

What the app does today is in the [README](README.md) and the notes under
[docs/](docs/): the [API reference](docs/api.md), the
[architecture](docs/architecture.md) and [what gets counted](docs/analytics.md).

- **Next**: small or well understood. I would start with these.
- **Later**: worth doing, but bigger or waiting on a decision.
- **Maybe**: not sure yet that they are worth the extra complexity.

Sizes are rough: **S** is an evening or two, **M** a few evenings up to a
couple of weekends, **L** several weeks of spare time.

Each item is meant to fit in one pull request and to be covered by the test
suite. Tests sit next to the code they cover: pure helpers in
`server/src/lib` have their own `*.test.ts`, route tests in
`server/src/routes` call the Hono app built by `createApp` against a fresh
in-memory SQLite database with all migrations applied
(`server/src/test/helpers.ts`), and the dashboard has jsdom and Testing
Library tests in `web/src`. There are no browser tests. So logic worth testing
(slug rules, URL rules, bot detection, date buckets) belongs in
`server/src/lib`, queries in `server/src/services`, and routes stay thin. Most
items change `server/src/db/schema.ts` and bring a migration written by
`npm run db:generate` into `server/drizzle`.

When an item ships, its Overview row says **Shipped** in the Group column, its
section moves under a `## Shipped` heading at the end with one paragraph on
what was built and what was left out, and the same pull request updates the
README, the notes under `docs/` it touches and an `## Unreleased` entry at the
top of `CHANGELOG.md`.

"Depends on" lists real prerequisites only. Items that merely touch the same
file are not listed there; the bigger overlaps are mentioned in the items.

## Overview

| #   | Item                                         | Group | Area        | Size | Depends on |
| --- | -------------------------------------------- | ----- | ----------- | ---- | ---------- |
| 1   | Old slugs stay reserved                      | Next  | links       | S    | -          |
| 2   | Closing sign-ups                             | Next  | accounts    | S    | -          |
| 3   | Password reset from the command line         | Next  | accounts    | S    | -          |
| 4   | Scheduled backups                            | Next  | ops         | S    | -          |
| 5   | Query strings passed through                 | Next  | redirects   | S    | -          |
| 6   | Click limits that hold under load            | Later | redirects   | S    | -          |
| 7   | Instance admin and abuse reports             | Later | abuse       | M    | 2          |
| 8   | Blocked destinations                         | Later | abuse       | S    | -          |
| 9   | Preview before following                     | Later | redirects   | S    | -          |
| 10  | Rate limits on creating links and on the API | Later | security    | S    | -          |
| 11  | API key scopes and expiry                    | Later | api         | M    | -          |
| 12  | Sessions list and sign out elsewhere         | Later | accounts    | S    | -          |
| 13  | Two-factor sign in                           | Later | accounts    | M    | 12         |
| 14  | Email for resets and notices                 | Later | accounts    | M    | 3          |
| 15  | Unique visitors without storing addresses    | Later | analytics   | M    | -          |
| 16  | Countries from a local GeoIP file            | Later | analytics   | M    | -          |
| 17  | Click retention and daily rollups            | Later | analytics   | M    | -          |
| 18  | Many clicks, still fast                      | Later | performance | M    | -          |
| 19  | Redirect type per link                       | Later | redirects   | S    | -          |
| 20  | History of destination changes               | Later | links       | S    | -          |
| 21  | Bulk create and bulk edit                    | Later | links       | M    | -          |
| 22  | Tag management                               | Later | links       | S    | -          |
| 23  | Expiry in your own time zone                 | Later | links       | S    | -          |
| 24  | Routing by device and country                | Later | redirects   | M    | -          |
| 25  | QR code styling                              | Later | qr          | S    | -          |
| 26  | Full account export                          | Later | accounts    | S    | -          |
| 27  | Accessibility pass and charts as tables      | Later | ui          | M    | -          |
| 28  | Bookmarklet for the current page             | Later | ui          | S    | -          |
| 29  | Metrics and structured logs                  | Later | ops         | S    | -          |
| 30  | Upgrade and restore notes                    | Later | ops         | S    | 4          |
| 31  | Custom domains                               | Later | links       | L    | -          |
| 32  | Shared workspaces                            | Later | accounts    | L    | -          |
| 33  | Webhooks                                     | Maybe | api         | M    | -          |
| 34  | Broken destination checks                    | Maybe | links       | M    | -          |
| 35  | Link preview cards                           | Maybe | redirects   | M    | -          |
| 36  | Rotation between destinations                | Maybe | redirects   | M    | 24         |
| 37  | PostgreSQL as an option                      | Maybe | ops         | L    | -          |
| 38  | Browser tests for the dashboard              | Maybe | tests       | M    | -          |

## Next

### 1. Old slugs stay reserved

A printed QR code or a link in an old newsletter lives for years. Today, when a
user renames a slug (`PATCH /api/links/:id` with `slug`) or deletes a link, the
old slug is free at once: `slugTaken` only looks at the `links` table. Anyone
on the same instance can then create a link with that slug, and every old QR
code and email now sends people to their destination. Renaming also breaks
every place the old short URL was shared.

- A `retired_slugs` table: slug (lowercase, unique), the user who owned it,
  the link id it belonged to (nullable once the link is deleted), the date.
- Rename writes the old slug there and keeps it pointing at the same link, so
  `GET /old-slug` redirects (and is counted) like the new one. The link page
  lists its old slugs with a "release" button.
- Delete writes the slug there without a link. `GET` answers `410 Gone` with
  "This link was removed by its owner", not `404`.
- `slugTaken` checks both tables. The owner can reuse their own retired slug;
  nobody else can, unless the owner releases it.
- `uniqueSlug` must skip retired slugs too.
- Tricky: account deletion cascades links today. Retired slugs should outlive
  the account (with the user id set to null), or a deleted account frees all
  its slugs at once. Say so on the delete account screen.
- Undecided: whether released slugs need a cooling off period. I would keep
  it simple: released means free.
- Tests: route tests in `server/src/routes/links.test.ts` for rename keeping
  the old slug working, another user being refused the old slug, delete
  answering 410, and release.

### 2. Closing sign-ups

`POST /api/auth/register` is always open, limited only by 20 attempts per IP
per 15 minutes. Anyone who finds a public instance can create an account and
use the owner's domain for spam or phishing links, which is how open
shorteners end up on blocklists.

- `REGISTRATION` setting: `open`, `invite` or `closed`. The default for a new
  install becomes `closed` once one account exists, so the first person to
  open a fresh install can still sign up. `open` keeps today's behaviour.
- `invite`: signed in users create single use invite links (a token stored
  hashed, with an expiry), and the register page asks for it.
- The dashboard's register page shows "Sign-ups are closed on this instance"
  instead of the form.
- README: the setting in the configuration table, and a note that public
  instances should not be `open`.
- Tricky: the Docker demo seeds `demo@example.com`, which counts as the first
  account. With `SEED_DEMO=true` keep `open` unless the setting says
  otherwise, so the demo still lets people try registering.
- Tests: route tests for each mode, invite reuse refused, expired invite
  refused; config tests for the new value.

### 3. Password reset from the command line

There is no password reset at all, and no email. A user who forgets their
password has lost their links, and the person running the server has no tool
to help short of editing the SQLite file by hand.

- `npm run user:reset-password -- someone@example.com` (and the same through
  `docker compose exec app node dist/server/scripts/reset-password.js ...`):
  prints a new random password or takes one from stdin, hashes it with
  `hashPassword`, and deletes the user's sessions.
- `npm run user:list` for the admin to find the address.
- Email based reset is item 14; this is the floor that works without SMTP.
- Tests: the script's core as a function called from a test with the
  in-memory database; sessions are gone afterwards.

### 4. Scheduled backups

Everything is one SQLite file in the `data` volume. `docker compose down -v`
deletes it, and the README mentions that without a word about backups. Copying
the file while the app runs in WAL mode can give a broken copy.

- An in-process timer next to `pruneExpiredSessions` in `server/src/index.ts`:
  every `BACKUP_INTERVAL_HOURS` (default 24, `0` turns it off) it runs
  better-sqlite3's online `backup()` into `BACKUP_DIR` (default
  `/data/backups` in Docker) with a timestamped name, and keeps the last
  `BACKUP_KEEP` (default 14).
- Restore is a documented procedure: stop the app, copy a backup over
  `links.db`, remove the `-wal` and `-shm` files, start the app.
- `GET /api/health` could report the time of the last good backup.
- Tricky: a backup inside the same volume does not survive `down -v`. Say in
  the README that `BACKUP_DIR` should be a bind mount on the host, and show it
  in `docker-compose.yml` as a commented example.
- Tricky: `backup()` is asynchronous and runs in steps; it must not block the
  redirect path for long. The default step size is fine for files of a few
  hundred MB.
- Undecided: Litestream for continuous replication. It is self-hostable and
  optional, so it could be a documented alternative rather than code.
- Tests: a unit test that the rotation keeps the newest N; a test that a
  backup of a database with links opens and has the same rows.

### 5. Query strings passed through

`GET /:slug` redirects to `link.url` and drops the query string of the
request. `sho.rt/spring-sale?utm_source=newsletter` loses the campaign tag,
and many tools append parameters to the short URL expecting them to arrive.
Most shorteners pass them through.

- Merge the request's query parameters into the destination's, in
  `server/src/lib/url.ts` as a pure `withQuery(destination, search)`. When the
  same key is in both, the destination wins by default, so a link's own UTM
  values cannot be overwritten by whoever shares it.
- A per link setting `forwardQuery` (on by default for new links, off for
  existing ones in the migration so nothing changes under people's feet).
- The unlock form posts to `/:slug`; it must carry the original query along
  in a hidden field so a password protected link forwards it too.
- Tricky: a fragment (`#...`) on the destination must stay at the end after
  merging.
- Tests: unit tests for `withQuery` (empty, overlap, repeated keys, fragment,
  encoded characters); a redirect test with and without the setting.
