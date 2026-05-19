import { useEffect, useState } from 'preact/hooks';
import { api, errorMessage } from '../api';
import { CopyButton } from '../components/CopyButton';
import { EmptyState } from '../components/EmptyState';
import { formatDate, timeAgo } from '../format';
import type { ApiKey } from '../types';

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [name, setName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .listKeys()
      .then((res) => setKeys(res.keys))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    void load();
  }, []);

  async function create(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.createKey(name);
      setNewToken(res.token);
      setName('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(key: ApiKey) {
    if (!window.confirm(`Revoke "${key.name}"? Anything using it will stop working.`)) return;
    try {
      await api.revokeKey(key.id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section class="stack">
      <h1>API keys</h1>
      <p class="muted">
        Use a key to create and read links from scripts:{' '}
        <code>Authorization: Bearer &lt;key&gt;</code>. See the API notes in the docs.
      </p>

      <form class="card search" onSubmit={create}>
        <input
          required
          maxLength={60}
          placeholder="Key name, e.g. CI pipeline"
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
        />
        <button type="submit" class="primary" disabled={busy}>
          Create key
        </button>
      </form>

      {error && <p class="alert">{error}</p>}

      {newToken && (
        <div class="card notice">
          <strong>Copy your new key now. It won't be shown again.</strong>
          <div class="slug-cell">
            <code class="mono">{newToken}</code>
            <CopyButton text={newToken} />
          </div>
        </div>
      )}

      {keys && keys.length === 0 && (
        <EmptyState title="No API keys">Create one to use the API from your own tools.</EmptyState>
      )}
      {keys && keys.length > 0 && (
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Created</th>
              <th>Last used</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} class={key.revokedAt ? 'revoked' : ''}>
                <td>{key.name}</td>
                <td class="mono">{key.prefix}…</td>
                <td class="muted">{formatDate(key.createdAt)}</td>
                <td class="muted">{key.lastUsedAt ? timeAgo(key.lastUsedAt) : 'Never'}</td>
                <td class="num">
                  {key.revokedAt ? (
                    <span class="badge badge-muted">Revoked</span>
                  ) : (
                    <button type="button" class="small danger" onClick={() => revoke(key)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
