import { useEffect, useState } from 'react';
import { departmentsApi, employeesApi, itemsApi } from '../api/services';
import CreatableSelect from '../components/CreatableSelect';
import EmployeeHardwareModal, { employeeHardwareCount } from '../components/EmployeeHardwareModal';
import ItemDetailModal from '../components/ItemDetailModal';
import type { Department, Employee, Item } from '../types';

function apiMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const departmentOptions = departments.map((department) => ({
    id: department.id,
    label: department.name,
  }));

  const load = async () => {
    const [nextEmployees, nextDepartments, nextItems] = await Promise.all([
      employeesApi.list(),
      departmentsApi.list(),
      itemsApi.listAll(),
    ]);
    setEmployees(nextEmployees);
    setDepartments(nextDepartments);
    setItems(nextItems);
  };

  useEffect(() => {
    load().catch(() => setError('Failed to load employees.'));
  }, []);

  const onCreateDepartment = async (departmentName: string) => {
    const created = await departmentsApi.create({ name: departmentName });
    setDepartments(await departmentsApi.list());
    setDepartmentId(created.id);
  };

  const onCreate = async () => {
    if (!name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!departmentId) {
      setError('Select or add a department for this employee.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await employeesApi.create({ fullName: name.trim(), departmentId });
      setName('');
      await load();
      setMessage('Employee added.');
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not add this employee.'));
    } finally {
      setBusy(false);
    }
  };

  const onAssignDepartment = async (employee: Employee, nextDepartmentId: number | null) => {
    if (!nextDepartmentId) return;
    setError('');
    setMessage('');
    try {
      await employeesApi.update(employee.id, {
        fullName: employee.fullName,
        departmentId: nextDepartmentId,
      });
      await load();
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not save this department.'));
    }
  };

  const onCreateDepartmentForEmployee = async (employee: Employee, departmentName: string) => {
    const created = await departmentsApi.create({ name: departmentName });
    await employeesApi.update(employee.id, {
      fullName: employee.fullName,
      departmentId: created.id,
    });
    await load();
  };

  const onDelete = async (employee: Employee) => {
    if (!confirm(`Delete employee "${employee.fullName}"?`)) return;
    try {
      await employeesApi.remove(employee.id);
      await load();
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not delete this employee.'));
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Employees</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Save each employee with a department, then click a name to see the hardware issued to them.
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-[1.2fr_1fr_auto]">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Employee name</span>
          <input
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
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
        </label>
        <CreatableSelect
          label="Department"
          placeholder="Select department"
          options={departmentOptions}
          value={departmentId}
          addLabel="Add department"
          onChange={setDepartmentId}
          onCreate={onCreateDepartment}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void onCreate()}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white disabled:opacity-60 md:mt-6"
        >
          {busy ? 'Saving...' : 'Add Employee'}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--ok)]">{message}</p>}

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        {employees.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No employees yet. Add the people who receive hardware.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Employee</th>
                  <th className="px-2 py-2 font-medium">Department</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const deviceCount = employeeHardwareCount(items, employee);
                  return (
                  <tr key={employee.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedEmployee(employee)}
                        className="text-left font-medium text-[var(--brand)] hover:underline"
                      >
                        {employee.fullName}
                      </button>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {deviceCount === 1 ? '1 device' : `${deviceCount} devices`}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <CreatableSelect
                        placeholder="Select department"
                        options={departmentOptions}
                        value={employee.departmentId ?? null}
                        addLabel="Add department"
                        onChange={(id) => void onAssignDepartment(employee, id)}
                        onCreate={(departmentName) => onCreateDepartmentForEmployee(employee, departmentName)}
                      />
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void onDelete(employee)}
                        className="text-sm text-[var(--danger)] hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedEmployee && (
        <EmployeeHardwareModal
          employee={selectedEmployee}
          items={items}
          onClose={() => {
            setSelectedEmployee(null);
            setSelectedItem(null);
          }}
          onSelectItem={setSelectedItem}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          mode="inventory"
          onClose={() => setSelectedItem(null)}
          onSaved={async () => {
            await load();
            const latest = (await itemsApi.listAll()).find((entry) => entry.id === selectedItem.id);
            if (latest) setSelectedItem(latest);
          }}
        />
      )}
    </div>
  );
}
