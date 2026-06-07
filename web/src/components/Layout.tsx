import type { ComponentChildren } from 'preact';
import { useAuth } from '../auth';
import { Link, useLocation } from '../router';

const NAV = [
  { href: '/', label: 'Links' },
  { href: '/keys', label: 'API keys' },
  { href: '/settings', label: 'Settings' },
];

export function Layout({ children }: { children: ComponentChildren }) {
  const { user, signOut } = useAuth();
  const { path } = useLocation();

  return (
    <div class="shell">
      <header class="topbar">
        <Link href="/" class="brand">
          link-shortener
        </Link>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              class={
                path === item.href ||
                (item.href !== '/' && path.startsWith(`${item.href}/`)) ||
                (item.href === '/' && path.startsWith('/links/'))
                  ? 'active'
                  : ''
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div class="account">
          <span class="muted">{user?.name}</span>
          <button type="button" class="ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main class="content">{children}</main>
    </div>
  );
}
