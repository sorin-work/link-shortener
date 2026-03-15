const numberFormat = new Intl.NumberFormat('en');

export const formatNumber = (n: number) => numberFormat.format(n);

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Today as YYYY-MM-DD, for the `min` of date inputs. */
export const todayIso = () => new Date().toISOString().slice(0, 10);

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(iso);
}

/** example.com/path without the scheme, for compact tables. */
export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    const rest = u.pathname === '/' ? '' : u.pathname;
    return u.host + rest + u.search;
  } catch {
    return url;
  }
}
