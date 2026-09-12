# What gets counted

## Clicks

Every request to `GET /:slug` that ends in a redirect is stored as a click
with its time, referrer, user agent and country header. `HEAD` requests,
password form views and requests to paused, expired or exhausted links are
not stored.

## Bots

A click is marked as a bot when the user agent is missing or matches a list
of crawlers, link unfurlers (Slack, WhatsApp, Discord, Telegram, Facebook,
LinkedIn, X), uptime monitors and HTTP libraries (`server/src/lib/bots.ts`).

- Bot clicks are **stored**, so you can still see them with
  `?bots=include` (the "Include bots" box on the link page).
- They are **not counted** in the links list, the overview, or the stats by
  default.
- They **do not use up** a link's click limit. Pasting a limited link into a
  chat app would otherwise burn a click for every preview.

## Click limits

`max_clicks` allows exactly that many human redirects; the next one gets a
`410` page. The counter (`click_count`) is stored on the link so the check
does not need to count rows.

## Days and time zones

All buckets are UTC. "Last 30 days" means today (UTC) and the 29 days before
it. The hour-of-day chart is shifted to the viewer's time zone in the
browser. A `YYYY-MM-DD` expiry means the end of that day, UTC.

## Countries

The country comes from a header set by your CDN or proxy
(`COUNTRY_HEADER`, default `cf-ipcountry`). Without such a proxy every
click shows up as "Unknown".
