import { useEffect, useState } from 'preact/hooks';
import { api, errorMessage } from '../api';
import { CopyButton } from '../components/CopyButton';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { EmptyState } from '../components/EmptyState';
import { displayUrl, formatNumber, timeAgo } from '../format';
import { navigate } from '../router';
import type { LinkPage } from '../types';

export function LinksPage() {
  const [data, setData] = useState<LinkPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .listLinks({})
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [version]);

  return (
    <section class="stack">
      <h1>Links</h1>
      <CreateLinkForm onCreated={() => setVersion((v) => v + 1)} />
      {error && <p class="alert">{error}</p>}
      {!data && !error && <p class="muted">Loading links…</p>}
      {data && data.links.length === 0 && (
        <EmptyState title="No links yet">Shorten your first URL to see it here.</EmptyState>
      )}
      {data && data.links.length > 0 && (
        <table class="table">
          <thead>
            <tr>
              <th>Short link</th>
              <th>Destination</th>
              <th class="num">Clicks</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.links.map((link) => (
              <tr key={link.id} class="clickable" onClick={() => navigate(`/links/${link.id}`)}>
                <td>
                  <div class="slug-cell">
                    <span class="mono">/{link.slug}</span>
                    <CopyButton text={link.shortUrl} />
                  </div>
                </td>
                <td>
                  {link.title && <div>{link.title}</div>}
                  <div class="muted truncate">{displayUrl(link.url)}</div>
                </td>
                <td class="num">{formatNumber(link.clicks)}</td>
                <td class="muted" title={link.createdAt}>
                  {timeAgo(link.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
