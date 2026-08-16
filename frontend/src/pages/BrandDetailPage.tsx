import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { brandsApi, itemsApi } from '../api/services';
import Barcode from '../components/Barcode';
import type { BrandDetail, Item } from '../types';

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-[var(--line)] px-3 py-2';

export default function BrandDetailPage() {
  const { id } = useParams();
  const brandId = Number(id);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [handedTo, setHandedTo] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [replacedItemCode, setReplacedItemCode] = useState('');
  const [replacedPerson, setReplacedPerson] = useState('');
  const [replacedTo, setReplacedTo] = useState('');
  const [replacedDate, setReplacedDate] = useState('');

  const load = async () => {
    const data = await brandsApi.get(brandId);
    setBrand(data);
    return data;
  };

  useEffect(() => {
    if (!brandId) return;
    load().catch(() => setError('Failed to load brand.'));
  }, [brandId]);

  const fillForm = (item: Item) => {
    setHandedTo(item.handedTo ?? '');
    setUniqueCode(item.uniqueCode);
    setReplacedItemCode(item.replacedItemCode ?? '');
    setReplacedPerson(item.replacedPerson ?? '');
    setReplacedTo(item.replacedTo ?? '');
    setReplacedDate(toDateInput(item.replacedDate));
    setSaveMessage('');
  };

  useEffect(() => {
    if (!selected) return;
    fillForm(selected);
  }, [selected?.id]);

  const selectItem = (item: Item) => {
    setSelected(item);
    fillForm(item);
    setError('');
  };

  const persistItem = async (item: Item, workingStatus: Item['workingStatus']) => {
    await itemsApi.update(item.id, {
      workingStatus,
      uniqueCode: uniqueCode.trim().toUpperCase() || item.uniqueCode,
      notes: item.notes || undefined,
      notWorkingReason:
        workingStatus === 'NotWorking' ? item.notWorkingReason || undefined : undefined,
    });
    const data = await load();
    const updated = data.items.find((x) => x.id === item.id) ?? null;
    setSelected(updated);
    return updated;
  };

  const updateStatus = async (item: Item, workingStatus: 'Working' | 'NotWorking') => {
    setError('');
    setSaveMessage('');
    if (workingStatus === 'NotWorking' && !item.notWorkingReason?.trim()) {
      setError('A reason is required to mark this item as Not Working. Open it from Inventory to add the reason.');
      return;
    }
    try {
      await persistItem(item, workingStatus);
    } catch {
      setError('Could not update item status.');
    }
  };

  const saveDetails = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setSaveMessage('');
    try {
      await persistItem(selected, selected.workingStatus);
      setSaveMessage('Item details saved.');
    } catch {
      setError('Could not save item details.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item: Item) => {
    if (!confirm(`Delete item ${item.uniqueCode}?`)) return;
    try {
      await itemsApi.remove(item.id);
      if (selected?.id === item.id) setSelected(null);
      await load();
    } catch {
      setError('Could not delete this item.');
    }
  };

  if (!brand) return <p className="text-[var(--muted)]">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/components/${brand.hardwareComponentId}`}
          className="text-sm text-[var(--brand)] hover:underline"
        >
          ← Back to {brand.componentName}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">
          {brand.componentName} / {brand.name}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Review barcodes and working status. Issue items from Issue Hardware Components.
        </p>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Register new items from{' '}
        <Link to="/inventory" className="text-[var(--brand)] hover:underline">
          Inventory
        </Link>
        . Working status can be changed here. Barcode must stay unique.
      </p>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Items</h3>
          {brand.items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No items yet. Register them from Inventory.</p>
          ) : (
            <div className="space-y-3">
              {brand.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-3 ${
                    selected?.id === item.id
                      ? 'border-[var(--brand)] bg-[rgba(15,107,92,0.06)]'
                      : 'border-[var(--line)]'
                  }`}
                >
                  <button type="button" onClick={() => selectItem(item)} className="min-w-0 flex-1 text-left">
                    <p className="font-medium text-[var(--brand)] hover:underline">{item.uniqueCode}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.workingStatus === 'NotWorking' ? 'Not Working' : 'Working'}
                      {item.handedTo ? ` · ${item.handedTo}` : ''}
                    </p>
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="rounded-lg border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)]"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Item Details</h3>
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xl font-semibold">{selected.uniqueCode}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selected.componentName} / {selected.brandName}
                  {selected.handedTo ? ` · ${selected.handedTo}` : ''}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Working status</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(selected, 'Working')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      selected.workingStatus === 'Working'
                        ? 'bg-[var(--ok)] text-white'
                        : 'border border-[var(--ok)] text-[var(--ok)]'
                    }`}
                  >
                    Working
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected, 'NotWorking')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      selected.workingStatus === 'NotWorking'
                        ? 'bg-[var(--danger)] text-white'
                        : 'border border-[var(--danger)] text-[var(--danger)]'
                    }`}
                  >
                    Not Working
                  </button>
                </div>
              </div>

              <Field label="Barcode Number">
                <input
                  className={inputClass}
                  value={uniqueCode}
                  onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                />
              </Field>

              <div>
                <p className="mb-1 text-sm font-medium">Barcode</p>
                <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white p-3">
                  <Barcode value={uniqueCode || selected.uniqueCode} />
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-white"
              >
                Print barcode
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Issued to">
                  <p className={`${inputClass} bg-[var(--bg)]`}>{handedTo || 'Not issued'}</p>
                </Field>
                <Field label="Issued date">
                  <p className={`${inputClass} bg-[var(--bg)]`}>
                    {selected.handedDate ? new Date(selected.handedDate).toLocaleDateString() : '—'}
                  </p>
                </Field>
              </div>

              {selected.workingStatus === 'NotWorking' && (
                <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 sm:grid-cols-2">
                  <Field label="Replaced Item Code">
                    <input
                      className={inputClass}
                      value={replacedItemCode}
                      onChange={(e) => setReplacedItemCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 100W-CH-2"
                    />
                  </Field>
                  <Field label="Replaced Person">
                    <input
                      className={inputClass}
                      value={replacedPerson}
                      onChange={(e) => setReplacedPerson(e.target.value)}
                      placeholder="Person who handled replacement"
                    />
                  </Field>
                  <Field label="Replaced to">
                    <input
                      className={inputClass}
                      value={replacedTo}
                      onChange={(e) => setReplacedTo(e.target.value)}
                      placeholder="Person or location replaced to"
                    />
                  </Field>
                  <Field label="Replaced Date">
                    <input
                      type="date"
                      className={inputClass}
                      value={replacedDate}
                      onChange={(e) => setReplacedDate(e.target.value)}
                    />
                  </Field>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveDetails}
                  className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save details'}
                </button>
                {saveMessage && <p className="text-sm text-[var(--ok)]">{saveMessage}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Select an item to view and update its details.</p>
          )}
        </section>
      </div>
    </div>
  );
}
