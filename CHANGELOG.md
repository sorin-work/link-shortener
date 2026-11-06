# Changelog

## 1.0.0 - 2026-11-06

First stable release.

### Links

- Generated or custom slugs; custom slugs are case-insensitive and checked
  against reserved paths
- Destination validation (http/https only, no links to the shortener itself)
- Expiry dates, click limits, password protection and pausing
- Tags, search, sorting, pagination and bulk delete
- UTM builder and QR codes (SVG/PNG)

### Analytics

- Clicks per day and per hour, referrers, devices, browsers, operating
  systems and countries
- Bot and link preview detection; bots are kept out of the numbers and click
  limits
- CSV export of clicks and of all links
- Weekly overview on the dashboard

### Accounts and API

- Registration, sessions, password change and account deletion
- API keys (bearer tokens) for the links, stats, export and QR endpoints
- Rate limits on sign in, sign up and password-protected links
- Security headers and request ids

### Operations

- Single Docker image with healthcheck, demo data on first start
- SQLite with Drizzle migrations applied on start
- GitHub Actions CI: lint, format, type check, tests, build and image build
