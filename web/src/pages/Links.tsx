import { useEffect, useRef, useState } from 'preact/hooks';
import { api, errorMessage, toQuery } from '../api';
import { CopyButton } from '../components/CopyButton';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { Summary } from '../components/Summary';
import { Tags } from '../components/Tags';
import { StatusBadges } from '../components/StatusBadge';
import { displayUrl, formatNumber, timeAgo } from '../format';
import { useTitle } from '../hooks';
import { useToast } from '../toast';
import { navigate, useLocation } from '../router';
import type { LinkPage } from '../types';

export function LinksPage() {
  const { query } = useLocation();
  const page = Math.max(1, Number(query.get('page')) || 1);
  const q = query.get('q') ?? '';
  const sort = query.get('sort') ?? 'newest';
  const tag = query.get('tag') ?? '';
  const [allTags, setAllTags] = useState<{ name: string; links: number }[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  async function deleteSelected() {
    if (!window.confirm(`Delete ${selected.size} link(s) and their click history?`)) return;
    try {
      const { deleted } = await api.deleteLinks([...selected]);
      notify(`Deleted ${deleted} link(s)`);
      setSelected(new Set());
      setVersion((v) => v + 1);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  }
  const [search, setSearch] = useState(q);
  const [data, setData] = useState<LinkPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useTitle('Links');
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable]');
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const notify = useToast();

  useEffect(() => {
    let cancelled = false;
    api
      .listLinks({ page, q, sort, tag })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [version, page, q, sort, tag]);

  useEffect(() => {
    api
      .listTags()
      .then((res) => setAllTags(res.tags))
      .catch(() => setAllTags([]));
  }, [version]);

  const go = (next: { page?: number; q?: string; sort?: string; tag?: string }) => {
    const nextSort = next.sort ?? sort;
    navigate(
      `/${toQuery({
        q: next.q ?? q,
        tag: next.tag ?? tag,
        sort: nextSort === 'newest' ? undefined : nextSort,
        page: next.page && next.page > 1 ? next.page : undefined,
      })}`,
    );
  };

  return (
    <section class="stack">
      <div class="page-header">
        <h1>Links</h1>
        {data && data.total > 0 && (
          <a class="button" href="/api/links/export.csv" download>
            Export CSV
          </a>
        )}
      </div>
      <Summary version={version} />
      <CreateLinkForm
        onCreated={(link) => {
          notify(`Created /${link.slug}`);
          setVersion((v) => v + 1);
        }}
      />
      <form
        class="search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: search.trim(), page: 1 });
        }}
      >
        <input
          ref={searchInput}
          type="search"
          placeholder="Search by slug, URL or title (press /)"
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
        {allTags.length > 0 && (
          <select
            value={tag}
            aria-label="Filter by tag"
            onChange={(e) => go({ tag: e.currentTarget.value, page: 1 })}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t.name} value={t.name}>
                #{t.name} ({t.links})
              </option>
            ))}
          </select>
        )}
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
              <th class="check">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={data.links.length > 0 && data.links.every((l) => selected.has(l.id))}
                  onChange={(e) =>
                    setSelected(
                      e.currentTarget.checked ? new Set(data.links.map((l) => l.id)) : new Set(),
                    )
                  }
                />
              </th>
              <th>Short link</th>
              <th>Destination</th>
              <th class="num">Clicks</th>
              <th class="hide-sm">Last click</th>
              <th class="hide-sm">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.links.map((link) => (
              <tr key={link.id} class="clickable" onClick={() => navigate(`/links/${link.id}`)}>
                <td class="check" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select /${link.slug}`}
                    checked={selected.has(link.id)}
                    onChange={() => toggle(link.id)}
                  />
                </td>
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
                  <Tags tags={link.tags} onSelect={(t) => go({ tag: t, page: 1 })} />
                </td>
                <td class="num">{formatNumber(link.clicks)}</td>
                <td class="muted hide-sm" title={link.lastClickAt ?? undefined}>
                  {link.lastClickAt ? timeAgo(link.lastClickAt) : '–'}
                </td>
                <td class="muted hide-sm" title={link.createdAt}>
                  {timeAgo(link.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onPage={(p) => go({ page: p })} />}
      {selected.size > 0 && (
        <div class="bulk-bar">
          <span>{selected.size} selected</span>
          <button type="button" class="danger" onClick={deleteSelected}>
            Delete selected
          </button>
          <button type="button" class="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}
    </section>
  );
}
