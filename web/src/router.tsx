import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export const BASE = '/app';

export interface Location {
  path: string;
  query: URLSearchParams;
}

function current(): Location {
  const { pathname, search } = window.location;
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return { path: path || '/', query: new URLSearchParams(search) };
}

export function navigate(to: string, { replace = false } = {}) {
  const url = BASE + to;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useLocation(): Location {
  const [location, setLocation] = useState(current);
  useEffect(() => {
    const update = () => setLocation(current());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return location;
}

/** Matches `/links/:id` style patterns. Returns the params, or null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const want = pattern.split('/').filter(Boolean);
  const got = path.split('/').filter(Boolean);
  if (want.length !== got.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < want.length; i++) {
    const segment = want[i]!;
    if (segment.startsWith(':')) params[segment.slice(1)] = decodeURIComponent(got[i]!);
    else if (segment !== got[i]) return null;
  }
  return params;
}

interface LinkProps {
  href: string;
  class?: string;
  title?: string;
  children: ComponentChildren;
}

export function Link({ href, children, ...rest }: LinkProps) {
  return (
    <a
      href={BASE + href}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
