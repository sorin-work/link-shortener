import { useEffect, useState } from 'preact/hooks';
import { api, errorMessage } from '../api';
import { BarChart } from '../components/BarChart';
import { Breakdown } from '../components/Breakdown';
import { CopyButton } from '../components/CopyButton';
import { EditLinkForm } from '../components/EditLinkForm';
import { QrPanel } from '../components/QrPanel';
import { StatusBadges } from '../components/StatusBadge';
import { formatDate, formatNumber } from '../format';
import { useTitle } from '../hooks';
import { Link as RouterLink, navigate } from '../router';
import type { Link, LinkStats } from '../types';

export function LinkDetailPage({ id }: { id: number }) {
  const [link, setLink] = useState<Link | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  useTitle(link ? link.title || `/${link.slug}` : null);
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [days, setDays] = useState(30);
  const [includeBots, setIncludeBots] = useState(false);

  useEffect(() => {
    api
      .getStats(id, days, includeBots)
      .then(setStats)
      .catch(() => setStats(null));
  }, [id, days, includeBots]);

  useEffect(() => {
    setLink(null);
    setError(null);
    api
      .getLink(id)
      .then((res) => setLink(res.link))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  async function remove() {
    if (!link || !window.confirm(`Delete /${link.slug}? Its click history goes with it.`)) return;
    try {
      await api.deleteLink(link.id);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (error) {
    return (
      <section class="stack">
        <p class="alert">{error}</p>
        <RouterLink href="/">Back to links</RouterLink>
      </section>
    );
  }
  if (!link) return <p class="muted">Loading…</p>;

  return (
    <section class="stack">
      <RouterLink href="/" class="back">
        ← All links
      </RouterLink>
      <header class="detail-header">
        <div>
          <h1>{link.title || `/${link.slug}`}</h1>
          <div class="slug-cell">
            <a href={link.shortUrl} target="_blank" rel="noreferrer" class="mono">
              {link.shortUrl}
            </a>
            <CopyButton text={link.shortUrl} />
            <StatusBadges link={link} />
          </div>
          <p class="muted truncate">→ {link.url}</p>
        </div>
        <div class="actions">
          <a class="button" href={`/api/links/${link.id}/clicks.csv?days=${days}`} download>
            Export CSV
          </a>
          <button type="button" onClick={() => setEditing(true)} disabled={editing}>
            Edit
          </button>
          <button type="button" class="danger" onClick={remove}>
            Delete
          </button>
        </div>
      </header>

      {editing && (
        <EditLinkForm
          link={link}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setLink(updated);
            setEditing(false);
          }}
        />
      )}

      <div class="stats-row">
        <div class="card stat">
          <span class="muted">Total clicks</span>
          <strong>{formatNumber(link.clicks)}</strong>
        </div>
        <div class="card stat">
          <span class="muted">Created</span>
          <strong>{formatDate(link.createdAt)}</strong>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Clicks per day</h2>
          <select
            value={days}
            aria-label="Period"
            onChange={(e) => setDays(Number(e.currentTarget.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        {stats && (
          <p class="muted">
            {formatNumber(stats.total)} clicks in the last {stats.range.days} days
            {stats.bots > 0 && !stats.includeBots && (
              <> (plus {formatNumber(stats.bots)} from bots and link previews)</>
            )}
          </p>
        )}
        <label class="checkbox">
          <input
            type="checkbox"
            checked={includeBots}
            onChange={(e) => setIncludeBots(e.currentTarget.checked)}
          />
          Include bots and link previews
        </label>
        {stats ? <BarChart data={stats.byDay} /> : <p class="muted">Loading stats…</p>}
      </div>

      {stats && (
        <div class="breakdowns">
          <Breakdown title="Referrers" rows={stats.referrers} />
          <Breakdown title="Countries" rows={stats.countries} />
          <Breakdown title="Devices" rows={stats.devices} />
          <Breakdown title="Browsers" rows={stats.browsers} />
          <Breakdown title="Operating systems" rows={stats.os} />
          <QrPanel linkId={link.id} slug={link.slug} />
        </div>
      )}
    </section>
  );
}
