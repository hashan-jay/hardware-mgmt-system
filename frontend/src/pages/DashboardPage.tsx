import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/services';
import type { Dashboard } from '../types';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch(() => setError('Failed to load dashboard.'));
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!data) return <p className="text-[var(--muted)]">Loading dashboard...</p>;

  const stats = [
    { label: 'Components', value: data.componentCount },
    { label: 'Brands', value: data.brandCount },
    { label: 'Total Items', value: data.totalItems },
    { label: 'Working', value: data.workingItems },
    { label: 'Not Working', value: data.notWorkingItems },
    { label: 'Active Scans', value: data.activeScanCount },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live summary of office hardware inventory and working status.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-sm text-[var(--muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Hardware Components</h3>
          <Link to="/inventory" className="text-sm text-[var(--brand)] hover:underline">
            Open inventory
          </Link>
        </div>
        {data.components.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No components yet. Add monitors, keyboards, and more from Inventory.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Brands</th>
                  <th className="px-2 py-2 font-medium">Items</th>
                </tr>
              </thead>
              <tbody>
                {data.components.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-2 py-3">
                      <Link to={`/components/${c.id}`} className="text-[var(--brand)] hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{c.brandCount}</td>
                    <td className="px-2 py-3">{c.itemCount}</td>
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
