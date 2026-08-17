import Barcode from './Barcode';
import type { Item, ScanItem } from '../types';

interface Props {
  item: Item;
  line?: ScanItem;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function formatDay(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function scanLineToItem(line: ScanItem): Item {
  return {
    id: line.hardwareItemId,
    brandId: 0,
    uniqueCode: line.uniqueCode,
    sequenceNumber: 0,
    isNewAcquisition: line.itemWasCreated,
    workingStatus: line.workingStatus,
    notes: line.notes,
    componentName: line.componentName,
    brandName: line.brandName,
    createdAt: line.scanStartedAt ?? new Date().toISOString(),
    handedTo: line.holderName,
    handedDate: line.handedDate,
    originalEmployeeName: line.originalEmployeeName,
    originalEmployeeDepartment: line.originalEmployeeDepartment,
    currentEmployeeId: line.currentEmployeeId,
    currentEmployeeName: line.holderName,
    currentEmployeeDepartment: line.holderDepartment,
    notWorkingReason: line.notWorkingReason,
    originalIssuedDate: line.originalIssuedDate,
  };
}

export default function ItemInspectModal({ item, line, onClose }: Props) {
  const currentName = item.currentEmployeeName || item.handedTo || line?.holderName || 'Unassigned';
  const currentDepartment = item.currentEmployeeDepartment || line?.holderDepartment;
  const originalDepartment = item.originalEmployeeDepartment || line?.originalEmployeeDepartment;
  const isIssued = Boolean(item.currentEmployeeId || line?.issued);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--overlay)] p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-lg">
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

        {line && (
          <div className="mt-4 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-sm sm:grid-cols-2">
            <p>
              Audit result:{' '}
              <span className="font-semibold">
                {line.isPresent ? (line.isExpected ? 'Found' : 'Found extra') : 'Misplaced / not scanned'}
              </span>
            </p>
            <p>
              Scanned at: <span className="font-semibold">{formatDate(line.scannedAt)}</span>
            </p>
            {line.scanTitle && (
              <p className="sm:col-span-2">
                Audit: <span className="font-semibold">{line.scanTitle}</span>
              </p>
            )}
            {line.notes && (
              <p className="sm:col-span-2">
                Scan notes: <span className="font-semibold">{line.notes}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-5 space-y-4 text-sm">
          <div className="rounded-xl border border-[var(--line)] p-4">
            <p className="font-medium">Working status</p>
            <p className="mt-1">
              {item.workingStatus === 'NotWorking' ? 'Not working' : 'Working'}
            </p>
            {item.notWorkingReason && (
              <p className="mt-1 text-[var(--muted)]">Reason: {item.notWorkingReason}</p>
            )}
            {item.notes && <p className="mt-1 text-[var(--muted)]">Notes: {item.notes}</p>}
          </div>

          <div className="rounded-xl border border-[var(--line)] p-4">
            <p className="font-medium">Person</p>
            <p className="mt-2">
              Original person: <span className="font-semibold">{item.originalEmployeeName || (isIssued ? currentName : '—')}</span>
            </p>
            {(originalDepartment || (isIssued && !item.originalEmployeeName && currentDepartment)) && (
              <p className="mt-1">
                Original department:{' '}
                <span className="font-semibold">{originalDepartment || currentDepartment}</span>
              </p>
            )}
            <p className="mt-1">
              Original issued date:{' '}
              <span className="font-semibold">{formatDay(item.originalIssuedDate || item.handedDate)}</span>
            </p>
            <p className="mt-1">
              Current person: <span className="font-semibold">{isIssued ? currentName : 'Not issued'}</span>
            </p>
            {isIssued && currentDepartment && (
              <p className="mt-1">
                Department: <span className="font-semibold">{currentDepartment}</span>
              </p>
            )}
            <p className="mt-1">
              Current issued date: <span className="font-semibold">{formatDay(item.handedDate)}</span>
            </p>
            {item.personChangeReason && (
              <p className="mt-1 text-[var(--muted)]">Last change reason: {item.personChangeReason}</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--line)] p-4">
            <p className="mb-2 font-medium">Barcode</p>
            <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white p-3">
              <Barcode value={item.uniqueCode} />
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Entered {formatDate(item.createdAt)}
              {item.isNewAcquisition ? ' · New acquisition' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
