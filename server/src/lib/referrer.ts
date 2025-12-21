// Click-tracking redirectors and mobile variants that really mean the same site.
const ALIASES: Record<string, string> = {
  't.co': 'x.com',
  'twitter.com': 'x.com',
  'mobile.twitter.com': 'x.com',
  'l.facebook.com': 'facebook.com',
  'lm.facebook.com': 'facebook.com',
  'm.facebook.com': 'facebook.com',
  'l.instagram.com': 'instagram.com',
  'out.reddit.com': 'reddit.com',
  'old.reddit.com': 'reddit.com',
  'lnkd.in': 'linkedin.com',
  'com.google.android.gm': 'mail.google.com',
  'com.slack': 'slack.com',
};

/** Reduces a Referer header to a host to group by, or null for direct traffic. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  let host = url.hostname.toLowerCase();
  if (!host) return null;
  if (host.startsWith('www.')) host = host.slice(4);
  return ALIASES[host] ?? host;
}
