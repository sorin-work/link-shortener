# API

All endpoints live under `/api` and speak JSON. Errors look like this:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [{ "path": "url", "message": "Enter a valid URL" }]
  }
}
```

## Authentication

The dashboard uses a session cookie (`sid`) set by `POST /api/auth/login`.

Scripts use an API key, created on the **API keys** page of the dashboard:

```bash
curl -H "Authorization: Bearer lsk_..." http://localhost:4415/api/links
```

API keys work for the links, stats, export and QR endpoints. Managing keys
and the account itself needs a browser session.

## Auth

| Method | Path                 | Body                               | Notes                    |
| ------ | -------------------- | ---------------------------------- | ------------------------ |
| POST   | `/api/auth/register` | `{ email, name, password }`        | starts a session         |
| POST   | `/api/auth/login`    | `{ email, password }`              | rate limited             |
| POST   | `/api/auth/logout`   |                                    | 204                      |
| GET    | `/api/auth/me`       |                                    | the signed in user       |
| PATCH  | `/api/auth/me`       | `{ name }`                         | rename                   |
| POST   | `/api/auth/password` | `{ currentPassword, newPassword }` | signs out other sessions |
| DELETE | `/api/auth/me`       | `{ password }`                     | deletes everything       |

## Links

| Method | Path                     | Notes                                                               |
| ------ | ------------------------ | ------------------------------------------------------------------- |
| GET    | `/api/links`             | `?page=1&limit=20&q=search&tag=x&sort=newest\|oldest\|clicks\|slug` |
| POST   | `/api/links`             | create, see fields below                                            |
| GET    | `/api/links/tags`        | tags in use with link counts                                        |
| GET    | `/api/links/export.csv`  | every link as CSV                                                   |
| POST   | `/api/links/bulk-delete` | `{ ids: [1, 2] }`, up to 100                                        |
| GET    | `/api/links/:id`         | one link with its click count                                       |
| PATCH  | `/api/links/:id`         | any of the fields below                                             |
| DELETE | `/api/links/:id`         | deletes the link and its clicks                                     |

Link fields:

| Field       | Type           | Notes                                                 |
| ----------- | -------------- | ----------------------------------------------------- |
| `url`       | string         | required on create; `https://` is added to bare hosts |
| `slug`      | string         | optional, 3-64 letters, digits, `-` and `_`           |
| `title`     | string \| null | optional label                                        |
| `expiresAt` | string \| null | ISO timestamp or `YYYY-MM-DD`                         |
| `maxClicks` | number \| null | stop redirecting after this many clicks               |
| `password`  | string \| null | visitors must enter it; `null` removes it (PATCH)     |
| `tags`      | string[]       | up to 10, lowercased; letters, digits, `-` and `_`    |
| `paused`    | boolean        | PATCH only; paused links answer `410`                 |

Example:

```bash
curl -X POST http://localhost:4415/api/links \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/spring", "slug": "spring", "maxClicks": 500}'
```

## Stats and exports

| Method | Path                        | Notes                                                  |
| ------ | --------------------------- | ------------------------------------------------------ |
| GET    | `/api/links/:id/stats`      | `?days=30&bots=include` (bots are excluded by default) |
| GET    | `/api/links/:id/clicks.csv` | `?days=30`, one row per click                          |
| GET    | `/api/links/:id/qr`         | `?format=svg\|png&size=256&download=1`                 |
| GET    | `/api/overview`             | link count, clicks this and last week, top links       |

## API keys

| Method | Path            | Notes                                  |
| ------ | --------------- | -------------------------------------- |
| GET    | `/api/keys`     | list (tokens are never returned again) |
| POST   | `/api/keys`     | `{ name }`, returns `{ key, token }`   |
| DELETE | `/api/keys/:id` | revoke                                 |

## Short links

`GET /:slug` redirects with `302` and records a click. Expired links and links
past their click limit answer `410`. Password-protected links show a form that
posts to `POST /:slug`.
