import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('uses defaults for an empty environment', () => {
    const config = loadConfig({});
    expect(config.port).toBe(3000);
    expect(config.baseUrl).toBe('http://localhost:3000');
    expect(config.sessionTtlDays).toBe(30);
    expect(config.secureCookies).toBe(false);
    expect(config.countryHeader).toBe('cf-ipcountry');
  });

  it('strips trailing slashes from BASE_URL and enables secure cookies for https', () => {
    const config = loadConfig({ BASE_URL: 'https://sho.rt//' });
    expect(config.baseUrl).toBe('https://sho.rt');
    expect(config.secureCookies).toBe(true);
  });

  it('lets SECURE_COOKIES override the https default', () => {
    expect(loadConfig({ BASE_URL: 'https://sho.rt', SECURE_COOKIES: 'false' }).secureCookies).toBe(
      false,
    );
    expect(loadConfig({ SECURE_COOKIES: 'yes' }).secureCookies).toBe(true);
  });

  it('normalises the country header name', () => {
    expect(loadConfig({ COUNTRY_HEADER: 'X-Country-Code' }).countryHeader).toBe('x-country-code');
  });

  it('builds the default base url from the port', () => {
    expect(loadConfig({ PORT: '8080' }).baseUrl).toBe('http://localhost:8080');
  });

  it('reads boolean flags', () => {
    const config = loadConfig({ SEED_DEMO: 'true', TRUST_PROXY: '1', LOG_REQUESTS: 'off' });
    expect(config).toMatchObject({ seedDemo: true, trustProxy: true, logRequests: false });
  });

  it.each(['sho.rt', 'ftp://sho.rt', 'https://example.com/links'])(
    'rejects BASE_URL %s',
    (value) => {
      expect(() => loadConfig({ BASE_URL: value })).toThrow(/BASE_URL/);
    },
  );

  it('rejects a non-numeric port', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
