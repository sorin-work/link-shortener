import { useEffect, useState } from 'preact/hooks';
import { api, errorMessage, toQuery } from '../api';
import { CopyButton } from '../components/CopyButton';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { Summary } from '../components/Summary';
import { StatusBadges } from '../components/StatusBadge';
import { displayUrl, formatNumber, timeAgo } from '../format';
import { navigate, useLocation } from '../router';
import type { LinkPage } from '../types';

export function LinksPage() {
  const { query } = useLocation();
  const page = Math.max(1, Number(query.get('page')) || 1);
  const q = query.get('q') ?? '';
  const sort = query.get('sort') ?? 'newest';
  const [search, setSearch] = useState(q);
  const [data, setData] = useState<LinkPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .listLinks({ page, q, sort })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [version, page, q, sort]);

  const go = (next: { page?: number; q?: string; sort?: string }) => {
    const nextSort = next.sort ?? sort;
    navigate(
      `/${toQuery({
        q: next.q ?? q,
        sort: nextSort === 'newest' ? undefined : nextSort,
        page: next.page && next.page > 1 ? next.page : undefined,
      })}`,
    );
  };

  return (
    <section class="stack">
      <h1>Links</h1>
      <Summary version={version} />
      <CreateLinkForm onCreated={() => setVersion((v) => v + 1)} />
      <form
        class="search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: search.trim(), page: 1 });
        }}
      >
        <input
          type="search"
          placeholder="Search by slug, URL or title"
          value={search}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
        <button type="submit">Search</button>
        <select
          value={sort}
          aria-label="Sort links"
          onChange={(e) => go({ sort: e.currentTarget.value, page: 1 })}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="clicks">Most clicks</option>
          <option value="slug">Slug A–Z</option>
        </select>
      </form>
      {error && <p class="alert">{error}</p>}
      {!data && !error && <p class="muted">Loading links…</p>}
      {data && data.links.length === 0 && !q && (
        <EmptyState title="No links yet">Shorten your first URL to see it here.</EmptyState>
      )}
      {data && data.links.length === 0 && q && (
        <EmptyState title="No matches">Nothing matches “{q}”.</EmptyState>
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
                    <StatusBadges link={link} />
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
      {data && <Pagination page={data.page} pages={data.pages} onPage={(p) => go({ page: p })} />}
    </section>
  );
}
