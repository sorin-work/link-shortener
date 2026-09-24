import { useRef, useState } from 'preact/hooks';
import { api, ApiError, errorMessage } from '../api';
import { parseTags, todayIso } from '../format';
import { UtmBuilder } from './UtmBuilder';
import type { Link } from '../types';

export function CreateLinkForm({ onCreated }: { onCreated: (link: Link) => void }) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [busy, setBusy] = useState(false);
  // State updates are async; the ref blocks a second submit in the same tick.
  const pending = useRef(false);

  const fieldError = (path: string) => (error instanceof ApiError ? error.field(path) : undefined);

  async function submit(e: Event) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const { link } = await api.createLink({
        url,
        slug: slug.trim() || undefined,
        title: title.trim() || undefined,
        expiresAt: expiresAt || undefined,
        maxClicks: maxClicks ? Number(maxClicks) : undefined,
        password: password || undefined,
        tags: tags ? parseTags(tags) : undefined,
      });
      setUrl('');
      setSlug('');
      setTitle('');
      setExpiresAt('');
      setMaxClicks('');
      setPassword('');
      setTags('');
      onCreated(link);
    } catch (err) {
      setError(err instanceof ApiError ? err : errorMessage(err));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <form class="card create-form" onSubmit={submit}>
      <label class="wide">
        Destination URL
        <input
          id="new-link-url"
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
      {showOptions && (
        <label>
          Expires on <span class="muted">(optional)</span>
          <input
            type="date"
            min={todayIso()}
            value={expiresAt}
            onInput={(e) => setExpiresAt(e.currentTarget.value)}
          />
          {fieldError('expiresAt') && <span class="field-error">{fieldError('expiresAt')}</span>}
        </label>
      )}
      {showOptions && (
        <label>
          Click limit <span class="muted">(optional)</span>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Unlimited"
            value={maxClicks}
            onInput={(e) => setMaxClicks(e.currentTarget.value)}
          />
          {fieldError('maxClicks') && <span class="field-error">{fieldError('maxClicks')}</span>}
        </label>
      )}
      {showOptions && (
        <label>
          Password <span class="muted">(optional)</span>
          <input
            type="password"
            autocomplete="new-password"
            placeholder="Visitors must enter it first"
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
          {fieldError('password') && <span class="field-error">{fieldError('password')}</span>}
        </label>
      )}
      {showOptions && (
        <label>
          Tags <span class="muted">(comma separated)</span>
          <input
            placeholder="spring, newsletter"
            value={tags}
            onInput={(e) => setTags(e.currentTarget.value)}
          />
          {fieldError('tags') && <span class="field-error">{fieldError('tags')}</span>}
        </label>
      )}
      {showOptions && (
        <div class="wide">
          <UtmBuilder url={url} onApply={setUrl} />
        </div>
      )}
      <div class="form-actions">
        <button type="button" class="ghost" onClick={() => setShowOptions(!showOptions)}>
          {showOptions ? 'Fewer options' : 'More options'}
        </button>
        {typeof error === 'string' && <p class="alert">{error}</p>}
        {error instanceof ApiError && error.fields.length === 0 && (
          <p class="alert">{error.message}</p>
        )}
        <button type="submit" class="primary" disabled={busy}>
          {busy ? 'Shortening…' : 'Shorten'}
        </button>
      </div>
    </form>
  );
}
