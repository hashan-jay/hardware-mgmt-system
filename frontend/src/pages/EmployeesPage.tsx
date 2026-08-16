import { useEffect, useState } from 'react';
import { employeesApi } from '../api/services';
import type { Employee } from '../types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setEmployees(await employeesApi.list());
  };

  useEffect(() => {
    load().catch(() => setError('Failed to load employees.'));
  }, []);

  const onCreate = async () => {
    if (!name.trim()) {
      setError('Employee name is required.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await employeesApi.create({ fullName: name.trim() });
      setName('');
      await load();
      setMessage('Employee added.');
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not add this employee.';
      setError(apiMessage);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (employee: Employee) => {
    if (!confirm(`Delete employee "${employee.fullName}"?`)) return;
    try {
      await employeesApi.remove(employee.id);
      await load();
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not delete this employee.';
      setError(apiMessage);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Employees</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add office employees here, then assign them to hardware from the dropdowns.
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
        <input
          className="rounded-lg border border-[var(--line)] px-3 py-2"
          placeholder="Employee name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void onCreate();
            }
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void onCreate()}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {busy ? 'Saving...' : 'Add Employee'}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--ok)]">{message}</p>}

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        {employees.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No employees yet. Add the people who receive hardware.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between gap-3 py-3">
                <p className="font-medium">{employee.fullName}</p>
                <button
                  type="button"
                  onClick={() => void onDelete(employee)}
                  className="text-sm text-[var(--danger)] hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
