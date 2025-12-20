import { describe, expect, it } from 'vitest';
import { parseUserAgent } from './useragent.js';

const UA = {
  chromeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  edgeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1',
  androidPhone:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
};

describe('parseUserAgent', () => {
  it.each([
    [UA.chromeWin, 'desktop', 'Chrome', 'Windows'],
    [UA.edgeWin, 'desktop', 'Edge', 'Windows'],
    [UA.safariMac, 'desktop', 'Safari', 'macOS'],
    [UA.firefoxLinux, 'desktop', 'Firefox', 'Linux'],
    [UA.iphone, 'mobile', 'Safari', 'iOS'],
    [UA.chromeIos, 'mobile', 'Chrome', 'iOS'],
    [UA.androidPhone, 'mobile', 'Chrome', 'Android'],
    [UA.androidTablet, 'tablet', 'Chrome', 'Android'],
    [UA.samsung, 'mobile', 'Samsung Internet', 'Android'],
    [UA.ipad, 'tablet', 'Safari', 'iOS'],
  ])('%s', (ua, device, browser, os) => {
    expect(parseUserAgent(ua)).toEqual({ device, browser, os });
  });

  it('handles missing and unusual agents', () => {
    expect(parseUserAgent(undefined)).toEqual({
      device: 'unknown',
      browser: 'Unknown',
      os: 'Unknown',
    });
    expect(parseUserAgent('curl/8.5.0')).toEqual({
      device: 'desktop',
      browser: 'Other',
      os: 'Other',
    });
  });
});
