import { formatNumber } from '../format';
import type { NamedCount } from '../types';

export function Breakdown({ title, rows }: { title: string; rows: NamedCount[] }) {
  const total = rows.reduce((sum, row) => sum + row.clicks, 0);
  return (
    <div class="card breakdown">
      <h2 class="card-title">{title}</h2>
      {rows.length === 0 ? (
        <p class="muted">No clicks in this period.</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.name}>
              <span class="bar-bg" style={{ width: `${(row.clicks / total) * 100}%` }} />
              <span class="name">{row.name}</span>
              <span class="count">{formatNumber(row.clicks)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
