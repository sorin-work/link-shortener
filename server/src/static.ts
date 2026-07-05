import fs from 'node:fs';
import path from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Hono } from 'hono';

/**
 * Serves the built Preact app under /app. Unknown /app/* paths get index.html
 * so client-side routes survive a reload. Returns false when there is no build.
 */
export function mountWeb(app: Hono, webDir: string): boolean {
  const indexFile = path.join(webDir, 'index.html');
  if (!fs.existsSync(indexFile)) return false;
  const indexHtml = fs.readFileSync(indexFile, 'utf8');
  const root = path.relative(process.cwd(), webDir) || '.';

  app.get('/', (c) => c.redirect('/app/'));
  app.get('/app', (c) => c.redirect('/app/'));
  app.use('/app/assets/*', async (c, next) => {
    await next();
    // Vite puts a content hash in every asset name.
    if (c.res.status === 200)
      c.res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  });
  app.use('/app/*', serveStatic({ root, rewriteRequestPath: (p) => p.replace(/^\/app/, '') }));
  app.get('/app/*', (c) => {
    c.header('Cache-Control', 'no-cache');
    return c.html(indexHtml);
  });
  return true;
}
