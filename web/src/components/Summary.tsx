import { useEffect, useState } from 'preact/hooks';
import { api } from '../api';
import { formatNumber } from '../format';
import { Link } from '../router';
import type { Overview } from '../types';

function trend(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? 'new this week' : 'no clicks yet';
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? '+' : ''}${change}% vs last week`;
}

export function Summary({ version }: { version: number }) {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api
      .overview()
      .then(setData)
      .catch(() => setData(null));
  }, [version]);

  if (!data || data.links === 0) return null;
  const top = data.topLinks[0];

  return (
    <div class="stats-row">
      <div class="card stat">
        <span class="muted">Links</span>
        <strong>{formatNumber(data.links)}</strong>
      </div>
      <div class="card stat">
        <span class="muted">Clicks, last 7 days</span>
        <strong>{formatNumber(data.clicksThisWeek)}</strong>
        <span class="muted small">{trend(data.clicksThisWeek, data.clicksLastWeek)}</span>
      </div>
      <div class="card stat">
        <span class="muted">Top link this week</span>
        {top ? (
          <Link href={`/links/${top.id}`} class="truncate">
            {top.title || `/${top.slug}`}
          </Link>
        ) : (
          <span class="muted">No clicks yet</span>
        )}
      </div>
    </div>
  );
}
