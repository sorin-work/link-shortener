const STYLE = `
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid;
         place-items: center; background: #f6f7f9; color: #1f2430; }
  main { max-width: 26rem; padding: 2rem; text-align: center; }
  h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
  p { color: #5b6272; margin: 0; }
  form { display: grid; gap: .6rem; margin-top: 1.25rem; }
  input, button { font: inherit; padding: .6rem .75rem; border-radius: 6px; border: 1px solid #d5d9e0; }
  button { background: #3b5bdb; border-color: #3b5bdb; color: #fff; cursor: pointer; }
  .error { color: #c92a2a; margin-top: .75rem; }
`;

export function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export const gonePage = (reason: string) =>
  page('Link unavailable', `<h1>Link unavailable</h1><p>${reason}</p>`);

export const unlockPage = (link: { slug: string; title: string | null }, error?: string) =>
  page(
    'Protected link',
    `<h1>${link.title || 'Protected link'}</h1>
<p>This link is password protected.</p>
${error ? `<p class="error">${error}</p>` : ''}
<form method="post" action="/${link.slug}">
  <input type="password" name="password" placeholder="Password" aria-label="Password" required autofocus>
  <button type="submit">Continue</button>
</form>`,
  );

export const notFoundPage = () =>
  page(
    'Link not found',
    '<h1>Link not found</h1><p>This short link does not exist or has been removed.</p>',
  );
