import { useState } from 'preact/hooks';
import { api, ApiError, errorMessage } from '../api';
import { todayIso } from '../format';
import type { Link } from '../types';

interface Props {
  link: Link;
  onSaved: (link: Link) => void;
  onCancel: () => void;
}

export function EditLinkForm({ link, onSaved, onCancel }: Props) {
  const [url, setUrl] = useState(link.url);
  const [slug, setSlug] = useState(link.slug);
  const [title, setTitle] = useState(link.title ?? '');
  const [expiresAt, setExpiresAt] = useState(link.expiresAt?.slice(0, 10) ?? '');
  const [error, setError] = useState<ApiError | string | null>(null);
  const [busy, setBusy] = useState(false);

  const fieldError = (path: string) => (error instanceof ApiError ? error.field(path) : undefined);

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.updateLink(link.id, {
        url,
        slug: slug.trim(),
        title: title.trim() || null,
        // Only send the expiry when it changed, so an unchanged timestamp isn't re-validated.
        ...(expiresAt !== (link.expiresAt?.slice(0, 10) ?? '') && { expiresAt: expiresAt || null }),
      });
      onSaved(res.link);
    } catch (err) {
      setError(err instanceof ApiError ? err : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form class="card stack" onSubmit={submit}>
      <label>
        Destination URL
        <input required value={url} onInput={(e) => setUrl(e.currentTarget.value)} />
        {fieldError('url') && <span class="field-error">{fieldError('url')}</span>}
      </label>
      <label>
        Slug
        <input required value={slug} onInput={(e) => setSlug(e.currentTarget.value)} />
        {fieldError('slug') && <span class="field-error">{fieldError('slug')}</span>}
      </label>
      <label>
        Title
        <input value={title} onInput={(e) => setTitle(e.currentTarget.value)} />
      </label>
      <label>
        Expires on <span class="muted">(leave empty to keep it forever)</span>
        <input
          type="date"
          min={todayIso()}
          value={expiresAt}
          onInput={(e) => setExpiresAt(e.currentTarget.value)}
        />
        {fieldError('expiresAt') && <span class="field-error">{fieldError('expiresAt')}</span>}
      </label>
      <div class="form-actions">
        {error && !(error instanceof ApiError && error.fields.length) && (
          <p class="alert">{typeof error === 'string' ? error : error.message}</p>
        )}
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" class="primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
