import { useState } from 'preact/hooks';
import { api, ApiError, errorMessage } from '../api';
import { useAuth } from '../auth';
import { useTitle } from '../hooks';

type Status = { kind: 'ok' | 'error'; text: string } | null;

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return <p class={status.kind === 'ok' ? 'success' : 'alert'}>{status.text}</p>;
}

export function SettingsPage() {
  const { user, signIn, signOut } = useAuth();
  useTitle('Settings');
  const [name, setName] = useState(user?.name ?? '');
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<Status>(null);

  async function saveProfile(e: Event) {
    e.preventDefault();
    try {
      const res = await api.updateProfile(name);
      signIn(res.user);
      setProfileStatus({ kind: 'ok', text: 'Saved.' });
    } catch (err) {
      setProfileStatus({ kind: 'error', text: errorMessage(err) });
    }
  }

  async function changePassword(e: Event) {
    e.preventDefault();
    try {
      await api.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '' });
      setPasswordStatus({ kind: 'ok', text: 'Password changed. Other devices were signed out.' });
    } catch (err) {
      const text =
        err instanceof ApiError ? (err.fields[0]?.message ?? err.message) : errorMessage(err);
      setPasswordStatus({ kind: 'error', text });
    }
  }

  async function deleteAccount(e: Event) {
    e.preventDefault();
    if (
      !window.confirm(
        'Delete your account, all links and all click history? This cannot be undone.',
      )
    ) {
      return;
    }
    try {
      await api.deleteAccount(deletePassword);
      await signOut();
    } catch (err) {
      setDeleteStatus({ kind: 'error', text: errorMessage(err) });
    }
  }

  return (
    <section class="stack narrow">
      <h1>Settings</h1>

      <form class="card stack" onSubmit={saveProfile}>
        <h2 class="card-title">Profile</h2>
        <label>
          Email
          <input value={user?.email} disabled />
        </label>
        <label>
          Name
          <input required value={name} onInput={(e) => setName(e.currentTarget.value)} />
        </label>
        <StatusLine status={profileStatus} />
        <div class="form-actions">
          <button type="submit" class="primary">
            Save
          </button>
        </div>
      </form>

      <form class="card stack" onSubmit={changePassword}>
        <h2 class="card-title">Password</h2>
        <label>
          Current password
          <input
            type="password"
            autocomplete="current-password"
            required
            value={passwords.current}
            onInput={(e) => setPasswords({ ...passwords, current: e.currentTarget.value })}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            autocomplete="new-password"
            required
            minLength={8}
            value={passwords.next}
            onInput={(e) => setPasswords({ ...passwords, next: e.currentTarget.value })}
          />
        </label>
        <StatusLine status={passwordStatus} />
        <div class="form-actions">
          <button type="submit" class="primary">
            Change password
          </button>
        </div>
      </form>

      <form class="card stack danger-zone" onSubmit={deleteAccount}>
        <h2 class="card-title">Delete account</h2>
        <p class="muted">Removes your links, their click history and your API keys.</p>
        <label>
          Confirm with your password
          <input
            type="password"
            autocomplete="current-password"
            required
            value={deletePassword}
            onInput={(e) => setDeletePassword(e.currentTarget.value)}
          />
        </label>
        <StatusLine status={deleteStatus} />
        <div class="form-actions">
          <button type="submit" class="danger">
            Delete my account
          </button>
        </div>
      </form>
    </section>
  );
}
