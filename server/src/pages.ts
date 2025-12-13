const STYLE = `
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid;
         place-items: center; background: #f6f7f9; color: #1f2430; }
  main { max-width: 26rem; padding: 2rem; text-align: center; }
  h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
  p { color: #5b6272; margin: 0; }
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

export const notFoundPage = () =>
  page(
    'Link not found',
    '<h1>Link not found</h1><p>This short link does not exist or has been removed.</p>',
  );
