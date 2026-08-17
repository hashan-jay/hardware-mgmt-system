import { useEffect, useState } from 'react';
import Barcode from './Barcode';
import StatusToggle from './StatusToggle';
import { employeesApi, itemsApi } from '../api/services';
import { formatEmployee } from '../formatEmployee';
import type { Employee, Item } from '../types';

interface Props {
  item: Item;
  mode: 'inventory' | 'issue';
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function apiMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export default function ItemDetailModal({ item, mode, onClose, onSaved }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [status, setStatus] = useState<Item['workingStatus']>(item.workingStatus);
  const [reason, setReason] = useState(item.notWorkingReason ?? '');
  const [barcode, setBarcode] = useState(item.uniqueCode);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [showBarcode, setShowBarcode] = useState(true);
  const [changeOn, setChangeOn] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState<number | ''>('');
  const [changeReason, setChangeReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== 'issue') return;
    employeesApi.list().then(setEmployees).catch(() => setError('Failed to load employees.'));
  }, [mode]);

  useEffect(() => {
    setStatus(item.workingStatus);
    setReason(item.notWorkingReason ?? '');
    setBarcode(item.uniqueCode);
    setNotes(item.notes ?? '');
    setChangeOn(false);
    setConfirmOpen(false);
    setNewEmployeeId('');
    setChangeReason('');
    setError('');
    setMessage('');
    setShowBarcode(true);
  }, [item.id]);

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : '—';

  const currentName = item.currentEmployeeName || item.handedTo || 'Unassigned';
  const originalName = item.originalEmployeeName || currentName;
  const isIssued = Boolean(item.currentEmployeeId);

  const saveInventory = async () => {
    if (!barcode.trim()) {
      setError('Barcode is required.');
      return;
    }
    if (status === 'NotWorking' && !reason.trim()) {
      setError('Please enter why this device is not working before saving.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await itemsApi.update(item.id, {
        uniqueCode: barcode.trim().toUpperCase(),
        workingStatus: status,
        notWorkingReason: status === 'NotWorking' ? reason.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      await onSaved();
      setMessage('Item details saved.');
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not save this item.'));
    } finally {
      setBusy(false);
    }
  };

  const saveIssue = async () => {
    if (!newEmployeeId) {
      setError('Select the employee this device is issued to.');
      return;
    }
    if (isIssued && !changeReason.trim()) {
      setError('Enter the reason for changing the person.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await itemsApi.issue(item.id, {
        employeeId: Number(newEmployeeId),
        reason: isIssued ? changeReason.trim() : undefined,
      });
      await onSaved();
      setChangeOn(false);
      setNewEmployeeId('');
      setChangeReason('');
      setMessage(isIssued ? 'Person change saved. The original person is unchanged.' : 'Item issued. Issued date saved as today.');
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not issue this item.'));
    } finally {
      setBusy(false);
    }
  };

  const printBarcode = () => {
    setShowBarcode(true);
    window.setTimeout(() => window.print(), 50);
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{item.uniqueCode}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {item.componentName} / {item.brandName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm">
            Close
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {mode === 'inventory' && (
            <div>
              <p className="mb-2 text-sm font-medium">Working status</p>
              <StatusToggle value={status} onChange={setStatus} />
              {status === 'NotWorking' && (
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block font-medium">Why is this device not working?</span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-[var(--line)] px-3 py-2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="This reason is required to save a Not Working device."
                  />
                </label>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Barcode</p>
            {mode === 'inventory' ? (
              <label className="mb-2 block text-sm">
                <span className="mb-1 block font-medium">Barcode number</span>
                <input
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 uppercase"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                />
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  Must stay unique. Another item’s barcode cannot be used.
                </span>
              </label>
            ) : (
              <p className="mb-2 text-sm text-[var(--muted)]">Unique identifier {item.uniqueCode}.</p>
            )}
            {showBarcode && (
              <div id="item-barcode-print" className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white p-3">
                <Barcode value={mode === 'inventory' ? barcode || item.uniqueCode : item.uniqueCode} />
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowBarcode(true)}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              >
                Generate barcode
              </button>
              <button
                type="button"
                onClick={printBarcode}
                className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-white"
              >
                Print barcode
              </button>
            </div>
          </div>

          {mode === 'inventory' && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Notes</span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-[var(--line)] px-3 py-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          )}

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <p className="text-sm font-medium">Person</p>
            <p className="mt-2 text-sm">
              Original person:{' '}
              <span className="font-semibold">{item.originalEmployeeName || (isIssued ? currentName : '—')}</span>
            </p>
            {(item.originalEmployeeDepartment || (isIssued && !item.originalEmployeeName && item.currentEmployeeDepartment)) && (
              <p className="mt-1 text-sm">
                Original department:{' '}
                <span className="font-semibold">
                  {item.originalEmployeeDepartment || item.currentEmployeeDepartment}
                </span>
              </p>
            )}
            <p className="mt-1 text-sm">
              Original issued date:{' '}
              <span className="font-semibold">{formatDate(item.originalIssuedDate || item.handedDate)}</span>
            </p>
            <p className="mt-1 text-sm">
              Current person: <span className="font-semibold">{isIssued ? currentName : 'Not issued'}</span>
            </p>
            {isIssued && item.currentEmployeeDepartment && (
              <p className="mt-1 text-sm">
                Department: <span className="font-semibold">{item.currentEmployeeDepartment}</span>
              </p>
            )}
            <p className="mt-1 text-sm">
              Current issued date: <span className="font-semibold">{formatDate(item.handedDate)}</span>
            </p>
            {item.personChangeReason && (
              <p className="mt-1 text-sm text-[var(--muted)]">Last change reason: {item.personChangeReason}</p>
            )}

            {mode === 'inventory' && (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Issue or reassign this item from Issue Hardware Components. Working status is updated here only.
              </p>
            )}

            {mode === 'issue' && (
              <>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{isIssued ? 'Change Person' : 'Issue to employee'}</span>
                  {isIssued ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={changeOn}
                      onClick={() => {
                        if (changeOn) {
                          setChangeOn(false);
                          setConfirmOpen(false);
                          return;
                        }
                        setConfirmOpen(true);
                      }}
                      className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
                        changeOn ? 'bg-[var(--brand)]' : 'bg-[var(--line)]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                          changeOn ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  ) : null}
                </div>

                {(!isIssued || changeOn) && (
                  <div className="mt-4 space-y-3 rounded-lg border border-[var(--line)] bg-white p-3">
                    {isIssued && (
                      <p className="text-sm text-[var(--muted)]">
                        Original person stays <span className="font-medium text-[var(--ink)]">{originalName}</span>.
                      </p>
                    )}
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">{isIssued ? 'Change to employee' : 'Employee'}</span>
                      <select
                        className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value ? Number(e.target.value) : '')}
                      >
                        <option value="">Select employee</option>
                        {employees
                          .filter((employee) => employee.id !== item.currentEmployeeId)
                          .map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {formatEmployee(employee.fullName, employee.departmentName, employee.fullName)}
                            </option>
                          ))}
                      </select>
                    </label>
                    <p className="text-sm text-[var(--muted)]">Issued date will be saved as today.</p>
                    {isIssued && (
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium">Reason for changing person</span>
                        <textarea
                          className="min-h-20 w-full rounded-lg border border-[var(--line)] px-3 py-2"
                          value={changeReason}
                          onChange={(e) => setChangeReason(e.target.value)}
                          placeholder="Required to approve the person change."
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveIssue()}
                      className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {busy ? 'Saving...' : isIssued ? 'Approve person change' : 'Issue item'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {message && <p className="text-sm text-[var(--ok)]">{message}</p>}

          {mode === 'inventory' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveInventory()}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? 'Saving...' : 'Save item'}
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="absolute inset-0 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h4 className="text-lg font-semibold">Change person?</h4>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Are you sure to change the person of this device? The original person will stay on record.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setChangeOn(false);
                }}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setChangeOn(true);
                }}
                className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
