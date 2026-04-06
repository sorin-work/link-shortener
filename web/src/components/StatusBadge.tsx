import type { Link } from '../types';

export function StatusBadges({ link }: { link: Link }) {
  return (
    <>
      <StatusBadge link={link} />
      {link.hasPassword && <span class="badge">Protected</span>}
    </>
  );
}

export function StatusBadge({ link }: { link: Link }) {
  if (link.expired) return <span class="badge badge-muted">Expired</span>;
  if (link.status === 'limit_reached') return <span class="badge badge-muted">Limit reached</span>;
  if (link.maxClicks !== null) {
    return (
      <span class="badge">
        {link.clickCount}/{link.maxClicks} clicks
      </span>
    );
  }
  if (link.expiresAt) {
    const date = new Date(link.expiresAt).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
    });
    return <span class="badge">Until {date}</span>;
  }
  return null;
}
