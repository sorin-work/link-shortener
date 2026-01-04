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

  it('rejects a non-numeric port', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
