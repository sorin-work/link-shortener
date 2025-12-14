export type Device = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface UserAgentInfo {
  device: Device;
  browser: string;
  os: string;
}

// Order matters: Edge, Opera and Samsung Internet all claim to be Chrome,
// and Chrome claims to be Safari.
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Version\/[\d.]+.*Safari\//, 'Safari'],
  [/MSIE |Trident\//, 'Internet Explorer'],
];

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/CrOS/, 'ChromeOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

function detectDevice(ua: string): Device {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return 'tablet';
  }
  if (/Mobi|iPhone|iPod|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function parseUserAgent(ua: string | null | undefined): UserAgentInfo {
  if (!ua || !ua.trim()) return { device: 'unknown', browser: 'Unknown', os: 'Unknown' };
  return {
    device: detectDevice(ua),
    browser: BROWSERS.find(([re]) => re.test(ua))?.[1] ?? 'Other',
    os: SYSTEMS.find(([re]) => re.test(ua))?.[1] ?? 'Other',
  };
}
