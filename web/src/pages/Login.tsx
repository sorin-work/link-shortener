import { useState } from 'preact/hooks';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { useTitle } from '../hooks';
import { Link, navigate } from '../router';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useTitle('Sign in');

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.login(email, password);
      signIn(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="auth-page">
      <form class="card auth-card" onSubmit={submit}>
        <h1>Sign in</h1>
        {error && <p class="alert">{error}</p>}
        <label>
          Email
          <input
            type="email"
            autocomplete="email"
            required
            value={email}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autocomplete="current-password"
            required
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
        </label>
        <button type="submit" class="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p class="muted">
          No account yet? <Link href="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
