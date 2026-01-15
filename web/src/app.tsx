import { AuthProvider, useAuth } from './auth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { useLocation } from './router';

function Routes() {
  const { path } = useLocation();
  const { user } = useAuth();

  if (user === undefined) return <div class="boot">Loading…</div>;
  if (!user) return path === '/register' ? <RegisterPage /> : <LoginPage />;

  return (
    <Layout>
      <h1>Hello, {user.name}</h1>
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
