import { AuthProvider, useAuth } from './auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ApiKeysPage } from './pages/ApiKeys';
import { LinkDetailPage } from './pages/LinkDetail';
import { LinksPage } from './pages/Links';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { SettingsPage } from './pages/Settings';
import { matchPath, useLocation } from './router';
import { ToastProvider } from './toast';

function Page({ path }: { path: string }) {
  if (path === '/' || path === '/login' || path === '/register') return <LinksPage />;
  if (path === '/keys') return <ApiKeysPage />;
  if (path === '/settings') return <SettingsPage />;
  const detail = matchPath('/links/:id', path);
  if (detail && Number(detail.id) > 0) return <LinkDetailPage id={Number(detail.id)} />;
  return (
    <section class="empty">
      <h2>Page not found</h2>
    </section>
  );
}

function Routes() {
  const { path } = useLocation();
  const { user } = useAuth();

  if (user === undefined) return <div class="boot">Loading…</div>;
  if (!user) return path === '/register' ? <RegisterPage /> : <LoginPage />;

  return (
    <Layout>
      <ErrorBoundary key={path}>
        <Page path={path} />
      </ErrorBoundary>
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes />
      </ToastProvider>
    </AuthProvider>
  );
}
