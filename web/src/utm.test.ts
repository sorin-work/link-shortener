import { describe, expect, it } from 'vitest';
import { buildUtmUrl, readUtm } from './utm';

describe('buildUtmUrl', () => {
  it('adds the filled in parameters in a stable order', () => {
    expect(
      buildUtmUrl('https://shop.example.com/spring', {
        campaign: 'spring_sale',
        source: 'newsletter',
        medium: 'email',
      }),
    ).toBe(
      'https://shop.example.com/spring?utm_source=newsletter&utm_medium=email&utm_campaign=spring_sale',
    );
  });

  it('encodes values and skips empty ones', () => {
    expect(buildUtmUrl('https://a.example/', { source: 'news letter', medium: '  ' })).toBe(
      'https://a.example/?utm_source=news%20letter',
    );
  });

  it('returns the url untouched when nothing is set', () => {
    expect(buildUtmUrl('https://a.example/x', {})).toBe('https://a.example/x');
  });
});

describe('readUtm', () => {
  it('reads existing parameters', () => {
    expect(readUtm('https://a.example/?utm_source=x&utm_campaign=y&other=1')).toEqual({
      source: 'x',
      campaign: 'y',
    });
  });

  it('copes with partial input', () => {
    expect(readUtm('example.com')).toEqual({});
  });
});
