# link-shortener

Self-hosted short links with click analytics.

- Generated or custom slugs (`/spring-sale`)
- Click analytics per link: clicks per day, referrers, devices, browsers,
  operating systems and countries
- A small dashboard to create, edit, search and delete links

## Stack

| Part  | Tech                                                    |
| ----- | ------------------------------------------------------- |
| API   | Node 22, Hono, TypeScript, Drizzle ORM + SQLite         |
| Web   | Preact, Vite                                            |
| Tests | Vitest (in-memory SQLite for the API, jsdom for the UI) |

## Local development

You need Node 22 or newer.

```bash
npm install
npm run dev
```

This starts the API on http://localhost:3000 and the dashboard on
http://localhost:5173/app/ (Vite proxies `/api` to the API). Short links are
served by the API, e.g. http://localhost:3000/my-slug.

The SQLite database is created at `data/links.db` and migrations run on start.

## Scripts

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | API with reload + Vite dev server            |
| `npm test`          | All tests (server and web)                   |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript for server and web                |
| `npm run build`     | Compile the API and build the dashboard      |
| `npm start`         | Run the built app (serves the dashboard too) |

## License

MIT
