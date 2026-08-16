import { useEffect, useMemo, useState } from 'react';
import { brandsApi, componentsApi } from '../api/services';
import type { Brand, Component } from '../types';

export interface ScanConfirmState {
  scannedCode: string;
  sequenceNumber: number;
  isNewAcquisition: boolean;
  suggestedComponentId?: number | null;
  suggestedBrandId?: number | null;
  workingStatus: 'Working' | 'NotWorking';
}

interface Props {
  open: boolean;
  initial: ScanConfirmState | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (payload: {
    brandId: number;
    sequenceNumber: number;
    isNewAcquisition: boolean;
    workingStatus: 'Working' | 'NotWorking';
    scannedCode: string;
  }) => void;
}

export default function ScanConfirmModal({ open, initial, busy, error, onCancel, onConfirm }: Props) {
  const [components, setComponents] = useState<Component[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [componentId, setComponentId] = useState<number>(0);
  const [brandId, setBrandId] = useState<number>(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!open || !initial) return;

    setLoadError('');
    componentsApi
      .list()
      .then((list) => {
        setComponents(list);
        const preferred =
          initial.suggestedComponentId && list.some((c) => c.id === initial.suggestedComponentId)
            ? initial.suggestedComponentId
            : list[0]?.id ?? 0;
        setComponentId(preferred);
      })
      .catch(() => setLoadError('Failed to load hardware components.'));
  }, [open, initial]);

  useEffect(() => {
    if (!open || !componentId) {
      setBrands([]);
      setBrandId(0);
      return;
    }

    brandsApi
      .list(componentId)
      .then((list) => {
        setBrands(list);
        const preferred =
          initial?.suggestedBrandId && list.some((b) => b.id === initial.suggestedBrandId)
            ? initial.suggestedBrandId
            : list[0]?.id ?? 0;
        setBrandId(preferred);
      })
      .catch(() => setLoadError('Failed to load brands for the selected component.'));
  }, [open, componentId, initial?.suggestedBrandId]);

  const selectedComponent = useMemo(
    () => components.find((c) => c.id === componentId) ?? null,
    [components, componentId],
  );
  const selectedBrand = useMemo(() => brands.find((b) => b.id === brandId) ?? null, [brands, brandId]);

  const previewCode = useMemo(() => {
    if (!initial || !selectedComponent || !selectedBrand) return '';
    const base = `${selectedComponent.codePrefix}-${selectedBrand.code}-${initial.sequenceNumber}`;
    return initial.isNewAcquisition ? `NEW-${base}` : base;
  }, [initial, selectedComponent, selectedBrand]);

  if (!open || !initial) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 shadow-lg">
        <h3 className="text-xl font-semibold">Confirm scanned item</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Choose the hardware component and brand. The scanned number stays locked.
        </p>

        <div className="mt-4 rounded-xl bg-[var(--bg)] px-3 py-2 text-sm">
          <p>
            Scanned: <span className="font-medium">{initial.scannedCode}</span>
          </p>
          <p className="mt-1">
            Final code preview: <span className="font-semibold text-[var(--brand)]">{previewCode || '—'}</span>
          </p>
        </div>

        <label className="mt-4 block text-sm font-medium">
          Hardware Component
          <select
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2"
            value={componentId || ''}
            onChange={(e) => setComponentId(Number(e.target.value))}
          >
            {components.length === 0 && <option value="">No components available</option>}
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.codePrefix})
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm font-medium">
          Brand
          <select
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2"
            value={brandId || ''}
            onChange={(e) => setBrandId(Number(e.target.value))}
            disabled={!componentId || brands.length === 0}
          >
            {brands.length === 0 && <option value="">No brands for this component</option>}
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm font-medium">
          Item number (locked)
          <input
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
            value={initial.sequenceNumber}
            readOnly
          />
        </label>

        {(loadError || error) && (
          <p className="mt-3 text-sm text-[var(--danger)]">{loadError || error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !brandId || !previewCode}
            onClick={() =>
              onConfirm({
                brandId,
                sequenceNumber: initial.sequenceNumber,
                isNewAcquisition: initial.isNewAcquisition,
                workingStatus: initial.workingStatus,
                scannedCode: initial.scannedCode,
              })
            }
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
