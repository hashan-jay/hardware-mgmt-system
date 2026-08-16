import { useEffect, useState } from 'react';
import { auditApi } from '../api/services';
import type { AuditLog } from '../types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    auditApi
      .list()
      .then(setLogs)
      .catch(() => setError('Failed to load audit logs.'));
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Audit Logs</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Trail of creates, updates, deletes, and inventory scans.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No audit events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2">When</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">Entity</th>
                  <th className="px-2 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-2 py-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">{log.username}</td>
                    <td className="px-2 py-3">{log.action}</td>
                    <td className="px-2 py-3">
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId}` : ''}
                    </td>
                    <td className="px-2 py-3">{log.details}</td>
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
