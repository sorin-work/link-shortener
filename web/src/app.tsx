import { AuthProvider, useAuth } from './auth';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { useLocation } from './router';

function Routes() {
  const { path } = useLocation();
  const { user } = useAuth();

  if (user === undefined) return <div class="boot">Loading…</div>;
  if (!user) return path === '/register' ? <RegisterPage /> : <LoginPage />;

  return (
    <main>
      <h1>Hello, {user.name}</h1>
    </main>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
