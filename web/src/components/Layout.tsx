import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { applyTheme, storedTheme, type Theme } from '../theme';
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
  const [theme, setTheme] = useState<Theme>(storedTheme);

  // Another tab changed the theme: follow it here too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'theme') return;
      const next = storedTheme();
      setTheme(next);
      applyTheme(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
          <select
            aria-label="Theme"
            value={theme}
            onChange={(e) => {
              const next = e.currentTarget.value as Theme;
              setTheme(next);
              applyTheme(next);
            }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
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
