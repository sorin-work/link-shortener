import { describe, expect, it } from 'vitest';
import { escapeHtml, unlockPage } from './pages.js';

describe('pages', () => {
  it('escapes html special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('never renders a link title as markup', () => {
    const html = unlockPage({ slug: 'promo', title: '<img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
