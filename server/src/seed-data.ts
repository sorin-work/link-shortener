// Weighted pools for generating believable demo traffic.

export const USER_AGENTS: [string, number][] = [
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    30,
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    22,
  ],
  [
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    14,
  ],
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
    12,
  ],
  ['Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0', 6],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    7,
  ],
  [
    'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    4,
  ],
  [
    'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
    5,
  ],
];

// Link unfurlers and crawlers, so the bot filter has something to filter.
export const BOT_AGENTS: [string, number][] = [
  ['Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 4],
  ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 3],
  ['facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 2],
  ['WhatsApp/2.23.20.0', 2],
  ['Twitterbot/1.0', 1],
];

export const REFERRERS: [string | null, number][] = [
  [null, 34],
  ['https://www.google.com/', 18],
  ['https://t.co/x1y2z3', 10],
  ['https://www.linkedin.com/feed/', 9],
  ['https://news.ycombinator.com/item?id=4242', 6],
  ['https://l.facebook.com/l.php', 5],
  ['https://www.reddit.com/r/selfhosted/', 7],
  ['android-app://com.google.android.gm/', 4],
  ['https://duckduckgo.com/', 3],
  ['https://newsletter.example.com/issues/12', 4],
];

export const COUNTRIES: [string | null, number][] = [
  ['US', 30],
  ['DE', 12],
  ['GB', 10],
  ['RO', 8],
  ['FR', 7],
  ['NL', 5],
  ['IN', 7],
  ['CA', 5],
  ['BR', 4],
  ['JP', 3],
  [null, 4],
];

/** Small deterministic PRNG so the demo looks the same on every machine. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weighted<T>(pool: [T, number][], rand: () => number): T {
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [value, weight] of pool) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return pool[pool.length - 1]![0];
}
