import { useEffect, useState } from 'preact/hooks';
import { api, errorMessage } from '../api';
import { CopyButton } from '../components/CopyButton';
import { EditLinkForm } from '../components/EditLinkForm';
import { formatDate, formatNumber } from '../format';
import { Link as RouterLink, navigate } from '../router';
import type { Link } from '../types';

export function LinkDetailPage({ id }: { id: number }) {
  const [link, setLink] = useState<Link | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

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
          </div>
          <p class="muted truncate">→ {link.url}</p>
        </div>
        <div class="actions">
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
    </section>
  );
}
