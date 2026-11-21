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

## Later

### 6. Click limits that hold under load

The click limit is checked by `availability(link)` on the row that was read,
and the counter is bumped afterwards with a separate `UPDATE`. On `GET` that
is safe today, because better-sqlite3 is synchronous and nothing awaits in
between. On `POST` (password protected links) the route awaits
`parseBody()` and `verifyPassword()` between the check and the bump, so two
unlocks at the same moment can both pass on the last allowed click.

- Bump with one conditional statement,
  `UPDATE links SET click_count = click_count + 1 WHERE id = ? AND (max_clicks IS NULL OR click_count < max_clicks) RETURNING click_count`,
  and only redirect when a row came back. The check and the bump become one
  statement on both paths.
- Re-read the link after the password check, so a link paused or expired
  while the form was open is not followed.
- Tests: a route test that fires two unlock posts concurrently for a link with
  one click left and expects one redirect and one 410.

### 7. Instance admin and abuse reports

Every account is equal. Whoever runs an instance cannot see what links exist,
pause a phishing link someone else made, or lock an account, without opening
the database.

- An `isAdmin` flag on users. The first account is admin;
  `npm run user:admin -- email` grants it (next to the scripts from 3).
- Admin pages in the dashboard: users (links count, created, last sign in,
  disable), all links with search by destination host, and "disable" on any
  link, which answers 410 with "This link was disabled" and cannot be undone
  by the owner.
- A public "Report this link" page at `/report?slug=...`, linked from the 410
  and unlock pages, that stores a report for the admin to review.
- Tricky: admin routes must be checked on the server for every call, not only
  hidden in the menu. API keys never carry admin rights.
- Tests: route tests for each admin action and the refusals for non-admins
  and API keys.

### 8. Blocked destinations

Nothing stops a link to a known malware or phishing host.

- A `BLOCKLIST_FILE` setting: a text file of domains, one per line, read on
  start and on `SIGHUP`. A destination whose host is the domain or a
  subdomain is refused with "This destination is not allowed".
- Checked on create and update, and again on redirect, so adding a domain to
  the list stops existing links too.
- Optional: an admin can add domains from the abuse page (7).
- Tricky: matching must work on the normalised host (`URL.hostname`,
  lowercase, punycode), not on the raw string, or `EXAMPLE.com.` slips past.
- Undecided: Google Safe Browsing or similar lookups. They need a hosted
  service and an API key, so at most an optional extra.
- Tests: unit tests for host matching; route tests for refusal on create and
  410 on redirect.

### 9. Preview before following

Short links hide where they go. Many shorteners let people add `+` to a short
URL to see the destination first.

- `GET /:slug+` shows a page with the destination, the title, the owner's
  name if they choose to show it, and a "Continue" button. It is not counted
  as a click.
- `+` is not a valid slug character today (`checkCustomSlug`), so there is no
  clash; the route must come before the catch-all `/:slug` in `createApp`.
- Password protected links show only that they are protected.
- Tests: route tests for the preview, a protected link, an expired link.

### 10. Rate limits on creating links and on the API

Sign in, sign up and unlocks are rate limited. Creating links is not, for
sessions or API keys, so one key in a loop can fill the database. Sign in is
limited per IP only, so a guesser spreading over many addresses is not slowed
down for one account.

- A per user and per key limit on `POST /api/links` and `bulk-delete` (say 60
  a minute and 1,000 a day), using the existing `createRateLimiter`.
- A second sign in limiter keyed by email, looser than the per IP one.
- `429` with `Retry-After`, as the other limits do, documented in
  `docs/api.md`.
- Tests: route tests for the 61st create and the per email sign in limit.

### 11. API key scopes and expiry

An API key can do everything the user can do with links: create, edit,
delete, export. A key pasted into a reporting script only needs to read.

- A `scopes` column on `api_keys` (`links:read`, `links:write`,
  `stats:read`), chosen when the key is created, and an optional expiry.
- `requireUser(db, { allowApiKey: true })` takes the scope a route needs; a
  key without it gets `403`.
- Existing keys get all scopes in the migration, so scripts keep working.
- Tests: route tests for each scope and for an expired key.

### 12. Sessions list and sign out elsewhere

Sessions last 30 days by default (`SESSION_TTL_DAYS`). Changing the password
or deleting the account clears them, but a user cannot see where they are
signed in or end one session.

- Store the user agent and the time of last use on `sessions` (last use
  written at most once an hour, so the redirect path is not involved and the
  dashboard does not write on every request).
- Settings lists them, marks the current one, and has "sign out" per session
  and "sign out everywhere else".
- Tests: route tests for listing and revoking, and that another user's
  session cannot be revoked.

### 13. Two-factor sign in

An account holds every link a person or a small company has printed. A
password alone is thin for a public instance.

- TOTP set up from settings with a QR code (the app already renders QR codes
  with `qrcode`), confirmed with one code, plus ten recovery codes stored
  hashed.
- Sign in asks for the code after the password, with its own rate limit.
- API keys are not affected.
- Tests: unit tests for code checks with a fixed clock; route tests for sign
  in with and without a code and a recovery code used once.

### 14. Email for resets and notices

With the command line reset (3) a server owner can help, but users cannot
help themselves.

- Optional SMTP settings (`SMTP_URL`, `MAIL_FROM`) with nodemailer. Without
  them every email feature stays off and the dashboard does not offer it.
- "Forgot password" sends a single use link (token stored hashed, one hour).
- Optional notices to the link owner: a link reached its click limit, a link
  expires in three days.
- A Mailpit service in a dev compose file for trying it locally.
- Tricky: the reset form must answer the same for known and unknown
  addresses, and be rate limited (10).
- Tests: route tests with a fake transport; the notice selection as a pure
  function.

### 15. Unique visitors without storing addresses

Clicks are counted, not people. One person clicking five times looks like
five. The app deliberately stores no IP address, which is good and should
stay.

- A `visitorHash` on clicks: sha256 of a daily rotating random salt, the IP
  and the user agent, truncated. The salt lives only in memory and in the
  database for the current day, and is deleted the next day, so yesterday's
  hashes cannot be linked to anyone or to today's.
- Stats show unique visitors per day next to clicks. Uniques across days are
  not possible by design; say so in `docs/analytics.md`.
- Tricky: behind a proxy without `TRUST_PROXY` every visitor has the same IP
  and uniques collapse to the number of user agents. Show a hint on the stats
  page when uniques are suspiciously low.
- Tests: unit tests for the hash and salt rotation with a fixed clock; a
  stats test with repeated visits.

### 16. Countries from a local GeoIP file

Countries come only from a CDN header (`COUNTRY_HEADER`). Without Cloudflare
or a similar proxy every click is "Unknown", which the README lists as a known
problem.

- An optional `GEOIP_DATABASE` setting pointing at an MMDB file (DB-IP Lite
  or MaxMind GeoLite2, downloaded by the server owner), read with the
  `maxmind` package. The header still wins when present.
- Only the country code is stored, never the address.
- Tests: a lookup with a small test MMDB fixture; the header taking
  precedence.

### 17. Click retention and daily rollups

Every click is a row kept for ever. A busy link with a few million clicks
makes the database large, and keeping user agents and referrers for years is
more than most owners need.

- `RETENTION_DAYS` (default unlimited). A nightly job aggregates clicks older
  than that into a `click_days` table (link, day, human clicks, bot clicks,
  and the top referrers, countries, devices and browsers for the day) and
  deletes the raw rows.
- Stats read raw rows for recent days and rollups for older ones, so charts
  over a year keep working. CSV export of clicks covers only raw rows; say so
  on the button.
- Tricky: `click_count` on links (for limits) is unaffected because it is
  stored on the link.
- Tests: the rollup as a function on the in-memory database; stats that span
  the boundary give the same totals as before the rollup.

### 18. Many clicks, still fast

The redirect path is one indexed lookup and one insert, which is fine. The
dashboard side grows with the number of clicks:

- Sorting links by clicks uses a correlated `count(*)` over `clicks` for every
  link (`humanClicks` in `services/links.ts`), and the overview joins all of a
  user's clicks for the week.
- There is an index on `(link_id, created_at)` but none that covers `is_bot`,
  so every human count reads the bot rows too.
- Clicks CSV export stops at `EXPORT_LIMIT` (100,000 rows); the export should
  say when it was cut off, or stream the whole thing.

Plan:

- Keep a `human_clicks` counter on links next to `click_count` (bumped in the
  same statement), use it for sorting and the list.
- An index on `(link_id, is_bot, created_at)`.
- A seed script that creates one link with a million clicks, and numbers
  before and after for the list, the stats page and the overview in the pull
  request.
- Tests: the counter stays right for human and bot clicks; existing stats
  tests keep passing.

### 19. Redirect type per link

Every redirect is a `302` with `Cache-Control: private, no-store`, so every
click reaches the server and is counted. Some owners prefer a permanent `301`
for links they never change (search engines pass ranking through it), and
some APIs need `307` or `308` to keep the request method.

- A `redirectType` per link: 302 (default), 301, 307, 308. The link form
  explains that browsers cache 301 and 308, so later clicks are not counted
  and changing the destination may not reach people who already clicked.
- Tests: redirect tests for each type.

### 20. History of destination changes

The destination can be changed at any time, which is the point of a short
link, but nothing records it. When a QR code on a poster suddenly goes
somewhere odd, the owner cannot tell when it changed.

- A `link_changes` table written by `PATCH /api/links/:id`: what changed
  (url, slug, expiry, limit, paused, password set or removed, never the
  password itself), old and new values, when, and whether a session or an API
  key (by name) did it.
- A "History" panel on the link page, and markers on the clicks chart where
  the destination changed.
- Tests: route tests that each change writes one entry and that the password
  is never stored.

### 21. Bulk create and bulk edit

Links can be deleted in bulk, but not created or edited. Making 40 links for
a campaign means 40 forms or a script against the API.

- Import a CSV (url, slug, title, tags, expiry, max clicks) with a preview of
  errors per row, created in one transaction or not at all. The CSV helper in
  `server/src/lib/csv.ts` writes CSV; reading needs a small parser with the
  same quoting rules.
- Bulk edit from the list selection: add or remove tags, pause or resume, set
  an expiry.
- Tests: unit tests for the parser; route tests for an import with one bad
  row and for each bulk action.

### 22. Tag management

Tags are a JSON array on each link (`links.tags`). There is no page for them,
so renaming "spring" to "spring-2026" or merging two spellings means editing
every link.

- A tags page: each tag with its link count, rename, merge into another, and
  delete (removes it from every link).
- Rename and merge rewrite the JSON on every matching link in one
  transaction, with `json_each` to find them.
- Tests: route tests for rename, merge into an existing tag (no duplicates on
  a link) and delete.

### 23. Expiry in your own time zone

A `YYYY-MM-DD` expiry means the end of that day in UTC (`docs/analytics.md`).
For someone in Sydney a link set to expire "on 31 March" dies at 11:00 on 1
April; in Los Angeles it dies on the afternoon of the 31st. Day buckets in the
stats are UTC too.

- Send the browser's time zone with the form and store the expiry as the end
  of that day in that zone. Keep accepting full ISO timestamps from the API
  unchanged.
- A time zone preference in settings, used for expiry and for the day
  buckets in stats (`windowStart` and `startOfUtcDay` in `server/src/lib/dates.ts` build them
  in one place).
- Tests: unit tests in `dates.test.ts` for zones ahead of and behind UTC and
  a daylight saving change.

### 24. Routing by device and country

One QR code on a product box should open the App Store on an iPhone and Google
Play on Android. A campaign may need a different page per country.

- Rules per link, checked in order: device (ios, android, desktop) or country
  code, each with its own destination. The link's main URL is the fallback.
- The user agent and country are already parsed on every click
  (`lib/useragent.ts`, `lib/country.ts`), so the redirect path only gains a
  loop over a few rules.
- Stats show clicks per rule.
- Tests: unit tests for rule matching; redirect tests for each kind.

### 25. QR code styling

QR codes come as black on white SVG or PNG in three sizes. People printing
them want their brand colours and a quiet zone that fits their layout.

- Foreground and background colour, margin, and error correction level, as
  query parameters on `GET /api/links/:id/qr` and controls in `QrPanel`.
- Refuse colour pairs with too little contrast to scan, with a message.
- A logo in the middle is left out: it needs uploads and high error
  correction, for a small gain.
- Tests: route tests for the parameters and the contrast refusal.

### 26. Full account export

There are CSV exports of all links and of one link's clicks, but nothing that
takes a whole account (links with all their settings, tags, every click) out
in one go, for moving to another instance or keeping a copy.

- `GET /api/export` returns one JSON file with the user's profile, links,
  clicks and API key names (never key hashes or password hashes).
- An import of that file on another instance, refusing slugs that are taken
  or retired (1).
- Tests: a round trip between two in-memory databases gives the same links
  and click counts.

### 27. Accessibility pass and charts as tables

The stats page is mostly charts (`BarChart`, `HourChart`, `Breakdown`) drawn
as SVG and styled boxes. A screen reader user gets little from them.

- Each chart gets a visually hidden table with the same numbers, or a "show
  as table" toggle, and a text summary ("412 clicks in the last 30 days, peak
  on 3 March").
- Keyboard pass over the dashboard: the links list selection, the bulk
  delete confirm, the QR panel and the toasts (`toast.tsx` should use a live
  region).
- Check contrast of status badges and charts in both themes (`theme.ts`).
- The unlock, 404 and 410 pages in `server/src/pages.ts`: a labelled password
  field, errors announced, and visible focus.
- Tests: component tests in `web/src/components/components.test.tsx` for the
  table alternatives and labels.

### 28. Bookmarklet for the current page

Making a short link for the page in front of you means copying the address,
opening the dashboard and pasting.

- The dashboard accepts `/app/?url=...&title=...` and opens the create form
  prefilled.
- A bookmarklet on the settings page that opens that URL with the current
  page's address and title. Nothing is created until the user presses
  Create.
- Tests: a component test for the prefill.

### 29. Metrics and structured logs

`GET /api/health` runs `select 1`, and the Hono `logger()` prints one plain
line per request. There is nothing to graph.

- `LOG_FORMAT=json` for one JSON line per request with the request id that
  `requestId()` already sets, method, path, status and duration. Short link
  paths should be logged as `/:slug` with the slug in a separate field, so
  logs can drop it if wanted.
- An optional `/api/metrics` in Prometheus text format behind a token:
  redirects by status, redirect latency, database size, clicks stored.
- Tests: unit test for the log line; route test that metrics need the token.

### 30. Upgrade and restore notes

Migrations run on start, which makes upgrades easy until one fails. There is
no note on how to upgrade, roll back, or restore.

- `docs/operations.md`: upgrading with Docker (take a backup, pull,
  `docker compose up --build`), what happens when a migration fails at start (the
  process exits, the old image still works with the old file), and restoring
  from a backup (4).
- From then on CHANGELOG entries say "includes migrations" when they do.
- No code.

### 31. Custom domains

One instance serves one `BASE_URL`. A small agency wants `go.client-a.com` and
`l.client-b.com` from the same install.

- A `domains` table (hostname, owner), links bound to a domain, slugs unique
  per domain instead of globally.
- The redirect route looks up by `Host` header and slug; unknown hosts get a
  plain 404.
- `serializeLink` builds `shortUrl` from the link's domain.
- Tricky: TLS for each domain is the reverse proxy's job (Caddy does it
  automatically); document that rather than terminating TLS in the app.
- Tricky: the unique index on `links.slug`, the retired slugs (1) and every
  `slugTaken` call become per domain.
- Tests: route tests with two hosts using the same slug.

### 32. Shared workspaces

Links belong to one user. A team sharing campaign links passes one password
around.

- Workspaces with members and roles (owner, editor, viewer). Links belong to
  a workspace; every user gets a personal one in the migration.
- `getOwnLink` becomes "a link in a workspace the user can see", which
  touches every route and service.
- API keys belong to a workspace.
- Why later and large: it changes ownership across the whole app, and it only
  pays off with several people per instance.
- Tests: a route matrix of roles against the link and stats endpoints.

## Maybe

### 33. Webhooks

Some owners want a click or a limit reached pushed to their own system.

- Per user webhook URLs with a signing secret, for "link created", "limit
  reached", "link expired" and optionally every click (batched once a
  minute).
- Tricky: the server calls user supplied URLs, which is a request forgery
  risk on a shared instance. Refuse private, loopback and link local
  addresses after DNS resolution, and redirects.
- Why maybe: the API with a key already covers polling, and per click
  delivery means a queue and retries in a one process app.

### 34. Broken destination checks

A short link printed on a flyer outlives the page it points to.

- A daily `HEAD` (falling back to `GET`) of each active destination, marking
  links whose destination answers 404, 410 or fails, shown as a badge in the
  list.
- Same request forgery guards as 33, a polite rate per host, and a user
  agent that says what it is.
- Why maybe: many sites block or rate limit automated requests, so false
  alarms are likely.

### 35. Link preview cards

When a short link is pasted into a chat app, the preview shows the
destination's card, because the unfurler follows the redirect. Owners
sometimes want their own title, description and image.

- Optional preview fields per link. Requests from known unfurlers
  (`lib/bots.ts` already recognises them) get a small HTML page with Open
  Graph tags instead of the redirect; people still get redirected.
- Why maybe: serving different content to bots and people is exactly what
  phishing pages do, and some platforms penalise it.

### 36. Rotation between destinations

Split traffic between two landing pages to compare them.

- A list of destinations with weights on a link, picked at random per click,
  with the chosen one stored on the click so stats can split by it.
- Why maybe: it overlaps with the routing rules (24) and with what proper A/B
  testing tools do better.

### 37. PostgreSQL as an option

SQLite is the right default for one process, and the README warns about
`SQLITE_BUSY` with more than one instance. Running two instances behind a
load balancer needs a shared database.

- Drizzle supports PostgreSQL, but the schema uses SQLite types
  (`integer` timestamps, JSON in `text`) and some queries use SQLite
  functions (`lower` on slugs is fine, `json_each` for tags is not portable).
- Why maybe: it doubles the test matrix, and the rate limiters are in memory,
  so several instances would need shared limits too.

### 38. Browser tests for the dashboard

The web tests render components in jsdom; nothing tests the built dashboard
against the real server.

- Playwright against `npm start` with a temporary database: sign in, create a
  link, follow it, see the click on the stats page.
- Why maybe: a browser in CI is slow and flaky. A single happy path would
  catch most breakage between the API client and the server.
