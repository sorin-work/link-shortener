import { useState } from 'preact/hooks';
import { api, ApiError, errorMessage } from '../api';
import { useAuth } from '../auth';
import { useTitle } from '../hooks';
import { Link, navigate } from '../router';

export function RegisterPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<ApiError | string | null>(null);
  const [busy, setBusy] = useState(false);
  useTitle('Create an account');

  const set = (key: keyof typeof form) => (e: Event) =>
    setForm({ ...form, [key]: (e.currentTarget as HTMLInputElement).value });
  const fieldError = (path: string) => (error instanceof ApiError ? error.field(path) : undefined);

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.register(form);
      signIn(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="auth-page">
      <form class="card auth-card" onSubmit={submit}>
        <h1>Create an account</h1>
        {error && <p class="alert">{typeof error === 'string' ? error : error.message}</p>}
        <label>
          Name
          <input required value={form.name} onInput={set('name')} autocomplete="name" />
          {fieldError('name') && <span class="field-error">{fieldError('name')}</span>}
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onInput={set('email')}
            autocomplete="email"
          />
          {fieldError('email') && <span class="field-error">{fieldError('email')}</span>}
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onInput={set('password')}
            autocomplete="new-password"
          />
          {fieldError('password') && <span class="field-error">{fieldError('password')}</span>}
        </label>
        <button type="submit" class="primary" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p class="muted">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
