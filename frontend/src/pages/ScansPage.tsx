import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { scansApi } from '../api/services';
import type { Scan } from '../types';

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setScans(await scansApi.list());
  };

  useEffect(() => {
    load().catch(() => setError('Failed to load inventory scans.'));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const scan = await scansApi.create({ title, notes: notes || undefined });
      setTitle('');
      setNotes('');
      window.location.href = `/scans/${scan.id}`;
    } catch {
      setError('Could not start inventory scan.');
    }
  };

  const onDelete = async (scan: Scan) => {
    if (!confirm(`Delete scan "${scan.title}"?`)) return;
    try {
      await scansApi.remove(scan.id);
      await load();
    } catch {
      setError('Could not delete this scan.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Inventory Scanning</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Start an audit check, scan barcodes, mark working status, and review missing items.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-[1.2fr_1fr_auto]"
      >
        <input
          placeholder="Scan title (e.g. March Office Audit)"
          className="rounded-lg border border-[var(--line)] px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Notes (optional)"
          className="rounded-lg border border-[var(--line)] px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white">
          Start Scan
        </button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Scan History</h3>
        {scans.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No inventory scans yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Scanned</th>
                  <th className="px-2 py-2">Working</th>
                  <th className="px-2 py-2">Not Working</th>
                  <th className="px-2 py-2">Started</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-2 py-3 font-medium">{scan.title}</td>
                    <td className="px-2 py-3">{scan.status}</td>
                    <td className="px-2 py-3">{scan.scannedCount}</td>
                    <td className="px-2 py-3">{scan.workingCount}</td>
                    <td className="px-2 py-3">{scan.notWorkingCount}</td>
                    <td className="px-2 py-3">{new Date(scan.startedAt).toLocaleString()}</td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <Link to={`/scans/${scan.id}`} className="text-[var(--brand)] hover:underline">
                          Open
                        </Link>
                        <button
                          onClick={() => onDelete(scan)}
                          className="text-[var(--danger)] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
