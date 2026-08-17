import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('netadmin');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username, password);
    } catch {
      setError('Invalid username or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-sm"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand)]">Hardware Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Track office hardware, brands, barcodes, and inventory audits.
        </p>

        <label className="mt-6 block text-sm font-medium">
          Username
          <input
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

        <button
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 font-medium text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="mt-5 rounded-lg bg-[var(--bg)] p-3 text-xs text-[var(--muted)]">
          <p>Developer: developer / Dev@12345</p>
          <p>Network Admin: netadmin / Admin@12345</p>
        </div>
      </form>
    </div>
  );
}
