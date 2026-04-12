// Crawlers, link unfurlers (chat apps fetch a link to build a preview card),
// monitoring and command line clients. Matched case-insensitively.
const BOT_PATTERN = new RegExp(
  [
    'bot\\b',
    'bot/',
    'crawl',
    'spider',
    'slurp',
    'facebookexternalhit',
    'facebookcatalog',
    'embedly',
    'quora link preview',
    'whatsapp',
    'skypeuripreview',
    'bitlybot',
    'vkshare',
    'pinterest',
    'outbrain',
    'headlesschrome',
    'lighthouse',
    'pingdom',
    'uptimerobot',
    'curl/',
    'wget/',
    'python-requests',
    'python-urllib',
    'go-http-client',
    'okhttp',
    'axios/',
    'node-fetch',
    'undici',
    'java/',
    'libwww-perl',
  ].join('|'),
  'i',
);

export function isBot(userAgent: string | null | undefined): boolean {
  // Real browsers always send a user agent.
  if (!userAgent || !userAgent.trim()) return true;
  return BOT_PATTERN.test(userAgent);
}
