import type { Link } from '../types';

export function StatusBadge({ link }: { link: Link }) {
  if (link.expired) return <span class="badge badge-muted">Expired</span>;
  if (link.expiresAt) {
    const date = new Date(link.expiresAt).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
    });
    return <span class="badge">Until {date}</span>;
  }
  return null;
}
