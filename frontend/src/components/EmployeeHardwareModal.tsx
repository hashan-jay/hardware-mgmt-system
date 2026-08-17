import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Employee, Item } from '../types';

interface Props {
  employee: Employee;
  items: Item[];
  onClose: () => void;
  onSelectItem?: (item: Item) => void;
}

function hardwareForEmployee(items: Item[], employee: Employee) {
  return items
    .filter(
      (item) =>
        item.currentEmployeeId === employee.id ||
        item.currentEmployeeName === employee.fullName ||
        item.handedTo === employee.fullName,
    )
    .sort((a, b) => a.componentName.localeCompare(b.componentName) || a.uniqueCode.localeCompare(b.uniqueCode));
}

function formatDay(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function EmployeeHardwareModal({ employee, items, onClose, onSelectItem }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hardware = hardwareForEmployee(items, employee);
  const department = employee.departmentName?.trim();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-hardware-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] px-6 py-5">
          <div>
            <h3 id="employee-hardware-title" className="text-xl font-semibold">
              {employee.fullName}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {department ? `${department} · ` : ''}
              {hardware.length === 1
                ? '1 hardware device currently issued'
                : `${hardware.length} hardware devices currently issued`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] p-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {hardware.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No hardware is currently issued to this employee.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="px-2 py-2 font-medium">Component</th>
                    <th className="px-2 py-2 font-medium">Brand</th>
                    <th className="px-2 py-2 font-medium">Barcode</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Issued date</th>
                  </tr>
                </thead>
                <tbody>
                  {hardware.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        onSelectItem
                          ? 'cursor-pointer border-b border-[var(--line)] last:border-0 hover:bg-[rgba(15,107,92,0.06)]'
                          : 'border-b border-[var(--line)] last:border-0'
                      }
                      onClick={() => onSelectItem?.(item)}
                    >
                      <td className="px-2 py-3 font-medium text-[var(--brand)]">{item.componentName}</td>
                      <td className="px-2 py-3">{item.brandName}</td>
                      <td className="px-2 py-3 font-medium">{item.uniqueCode}</td>
                      <td className="px-2 py-3">
                        {item.workingStatus === 'NotWorking' ? 'Not Working' : 'Working'}
                      </td>
                      <td className="px-2 py-3">{formatDay(item.handedDate || item.originalIssuedDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function employeeHardwareCount(items: Item[], employee: Employee) {
  return hardwareForEmployee(items, employee).length;
}
