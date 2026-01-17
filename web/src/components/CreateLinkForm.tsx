import { useState } from 'preact/hooks';
import { api, ApiError, errorMessage } from '../api';
import type { Link } from '../types';

export function CreateLinkForm({ onCreated }: { onCreated: (link: Link) => void }) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<ApiError | string | null>(null);

  const fieldError = (path: string) => (error instanceof ApiError ? error.field(path) : undefined);

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    try {
      const { link } = await api.createLink({
        url,
        slug: slug.trim() || undefined,
        title: title.trim() || undefined,
      });
      setUrl('');
      setSlug('');
      setTitle('');
      onCreated(link);
    } catch (err) {
      setError(err instanceof ApiError ? err : errorMessage(err));
    }
  }

  return (
    <form class="card create-form" onSubmit={submit}>
      <label class="wide">
        Destination URL
        <input
          required
          placeholder="https://example.com/a/very/long/page"
          value={url}
          onInput={(e) => setUrl(e.currentTarget.value)}
        />
        {fieldError('url') && <span class="field-error">{fieldError('url')}</span>}
      </label>
      <label>
        Custom slug <span class="muted">(optional)</span>
        <input
          placeholder="spring-sale"
          value={slug}
          onInput={(e) => setSlug(e.currentTarget.value)}
        />
        {fieldError('slug') && <span class="field-error">{fieldError('slug')}</span>}
      </label>
      <label>
        Title <span class="muted">(optional)</span>
        <input value={title} onInput={(e) => setTitle(e.currentTarget.value)} />
      </label>
      <div class="form-actions">
        {typeof error === 'string' && <p class="alert">{error}</p>}
        {error instanceof ApiError && error.fields.length === 0 && (
          <p class="alert">{error.message}</p>
        )}
        <button type="submit" class="primary">
          Shorten
        </button>
      </div>
    </form>
  );
}
