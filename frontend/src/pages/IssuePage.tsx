import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { brandsApi, componentsApi, employeesApi, itemsApi } from '../api/services';
import ItemDetailModal from '../components/ItemDetailModal';
import type { Brand, Component, Employee, Item } from '../types';

function apiMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export default function IssuePage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [componentId, setComponentId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [reissueReason, setReissueReason] = useState('');
  const [filterComponentId, setFilterComponentId] = useState<number | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null);
  const [filterBrands, setFilterBrands] = useState<Brand[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    const [componentData, itemData, employeeData] = await Promise.all([
      componentsApi.list(),
      itemsApi.listAll(),
      employeesApi.list(),
    ]);
    setComponents(componentData);
    setItems(itemData);
    setEmployees(employeeData);
  };

  useEffect(() => {
    loadAll().catch(() => setError('Failed to load hardware data.'));
  }, []);

  useEffect(() => {
    if (!componentId) {
      setBrands([]);
      setBrandId(null);
      setItemId('');
      return;
    }

    brandsApi
      .list(componentId)
      .then((data) => {
        setBrands(data);
        setBrandId((current) => (current && data.some((brand) => brand.id === current) ? current : null));
      })
      .catch(() => setError('Failed to load brands for this component.'));
  }, [componentId]);

  useEffect(() => {
    if (!filterComponentId) {
      setFilterBrands([]);
      setFilterBrandId(null);
      return;
    }

    brandsApi
      .list(filterComponentId)
      .then((data) => {
        setFilterBrands(data);
        setFilterBrandId((current) =>
          current && data.some((brand) => brand.id === current) ? current : null,
        );
      })
      .catch(() => setError('Failed to load brands for this component.'));
  }, [filterComponentId]);

  const barcodeItems = items.filter((item) => item.brandId === brandId);
  const selectedIssueItem = barcodeItems.find((item) => item.id === itemId) ?? null;
  const alreadyIssued = Boolean(selectedIssueItem?.currentEmployeeId);
  const filterComponent = components.find((component) => component.id === filterComponentId) ?? null;
  const visibleItems = items.filter((item) => {
    if (filterBrandId) return item.brandId === filterBrandId;
    if (filterComponent) return item.componentName === filterComponent.name;
    return false;
  });

  const resetForm = () => {
    setItemId('');
    setEmployeeId('');
    setReissueReason('');
  };

  const issueItem = async () => {
    if (!componentId) {
      setError('Select a hardware component.');
      return;
    }
    if (!brandId) {
      setError('Select a brand.');
      return;
    }
    if (!itemId) {
      setError('Select the barcode of the item to issue.');
      return;
    }
    if (employeeId === '') {
      setError('Select the employee this item is issued to.');
      return;
    }
    if (alreadyIssued && !reissueReason.trim()) {
      setError('Enter a reason to issue this item to a different person.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await itemsApi.issue(Number(itemId), {
        employeeId: Number(employeeId),
        reason: alreadyIssued ? reissueReason.trim() : undefined,
      });
      const issued = items.find((item) => item.id === itemId);
      resetForm();
      await loadAll();
      setFilterComponentId(componentId);
      setFilterBrandId(brandId);
      setMessage(`Issued ${issued?.uniqueCode ?? 'item'} successfully. Issued date saved as today.`);
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not issue this hardware item.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Issue Hardware Components</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Issue items already saved in Inventory. Select the component, brand, barcode, and employee, then click Issue.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <label className="block min-w-[180px] flex-1 text-sm">
            <span className="mb-1 block font-medium">1. Hardware Component</span>
            <select
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              value={componentId ?? ''}
              onChange={(e) => {
                setComponentId(e.target.value ? Number(e.target.value) : null);
                setBrandId(null);
                setItemId('');
                setError('');
                setMessage('');
              }}
            >
              <option value="">Select component</option>
              {components.map((component) => (
                <option key={component.id} value={component.id}>
                  {component.name}
                </option>
              ))}
            </select>
          </label>

          <ChevronRight className="hidden shrink-0 text-[var(--muted)] xl:mt-7 xl:block" size={18} />

          <label className="block min-w-[180px] flex-1 text-sm">
            <span className="mb-1 block font-medium">2. Brand</span>
            <select
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 disabled:bg-[var(--bg)] disabled:text-[var(--muted)]"
              value={brandId ?? ''}
              disabled={!componentId}
              onChange={(e) => {
                setBrandId(e.target.value ? Number(e.target.value) : null);
                setItemId('');
                setError('');
                setMessage('');
              }}
            >
              <option value="">{componentId ? 'Select brand' : 'Select a component first'}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <ChevronRight className="hidden shrink-0 text-[var(--muted)] xl:mt-7 xl:block" size={18} />

          <label className="block min-w-[180px] flex-1 text-sm">
            <span className="mb-1 block font-medium">3. Barcode</span>
            <select
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 uppercase disabled:bg-[var(--bg)] disabled:text-[var(--muted)]"
              value={itemId}
              disabled={!brandId}
              onChange={(e) => {
                setItemId(e.target.value ? Number(e.target.value) : '');
                setReissueReason('');
                setError('');
                setMessage('');
              }}
            >
              <option value="">{brandId ? 'Select barcode' : 'Select a brand first'}</option>
              {barcodeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.uniqueCode}
                  {item.currentEmployeeName ? ` · ${item.currentEmployeeName}` : ''}
                </option>
              ))}
            </select>
            {brandId && barcodeItems.length === 0 && (
              <span className="mt-1 block text-xs text-[var(--muted)]">
                No inventory items for this brand yet. Add them in Inventory.
              </span>
            )}
          </label>

          <ChevronRight className="hidden shrink-0 text-[var(--muted)] xl:mt-7 xl:block" size={18} />

          <label className="block min-w-[180px] flex-1 text-sm">
            <span className="mb-1 block font-medium">4. Employee</span>
            <select
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </label>

          {alreadyIssued && (
            <label className="block w-full text-sm xl:basis-full">
              <span className="mb-1 block font-medium">Reason for issuing to a different person</span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-[var(--line)] px-3 py-2"
                value={reissueReason}
                onChange={(e) => setReissueReason(e.target.value)}
                placeholder="Required because this barcode is already issued."
              />
            </label>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void issueItem()}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white hover:bg-[var(--brand-dark)] disabled:opacity-60 xl:mt-6"
          >
            {busy ? 'Issuing...' : 'Issue'}
          </button>
        </div>
        {selectedIssueItem && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Issued date is saved automatically as today.
            {selectedIssueItem.currentEmployeeName
              ? ` Currently with ${selectedIssueItem.currentEmployeeName}.`
              : ' This item is not issued yet.'}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--ok)]">{message}</p>}

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Existing items</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Items saved in Inventory. Choose a component, then a brand, to view barcodes you can issue.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Hardware Component</span>
            <select
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              value={filterComponentId ?? ''}
              onChange={(e) => {
                setFilterComponentId(e.target.value ? Number(e.target.value) : null);
                setFilterBrandId(null);
              }}
            >
              <option value="">Select component</option>
              {components.map((component) => (
                <option key={component.id} value={component.id}>
                  {component.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Brand</span>
            <select
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 disabled:bg-[var(--bg)] disabled:text-[var(--muted)]"
              value={filterBrandId ?? ''}
              disabled={!filterComponentId}
              onChange={(e) => setFilterBrandId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{filterComponentId ? 'All brands' : 'Select a component first'}</option>
              {filterBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!filterComponentId ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Select a hardware component to view its items.</p>
        ) : visibleItems.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No items found for this {filterBrandId ? 'brand' : 'component'}.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Component</th>
                  <th className="px-2 py-2 font-medium">Brand</th>
                  <th className="px-2 py-2 font-medium">Barcode</th>
                  <th className="px-2 py-2 font-medium">Person</th>
                  <th className="px-2 py-2 font-medium">Issued date</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-[var(--line)] last:border-0 hover:bg-[rgba(15,107,92,0.06)]"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-2 py-3 font-medium text-[var(--brand)]">{item.componentName}</td>
                    <td className="px-2 py-3">{item.brandName}</td>
                    <td className="px-2 py-3 font-medium text-[var(--brand)]">{item.uniqueCode}</td>
                    <td className="px-2 py-3">{item.currentEmployeeName || item.handedTo || '—'}</td>
                    <td className="px-2 py-3">
                      {item.handedDate ? new Date(item.handedDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          mode="issue"
          onClose={() => setSelectedItem(null)}
          onSaved={async () => {
            await loadAll();
            const latest = (await itemsApi.listAll()).find((entry) => entry.id === selectedItem.id);
            if (latest) setSelectedItem(latest);
          }}
        />
      )}
    </div>
  );
}
