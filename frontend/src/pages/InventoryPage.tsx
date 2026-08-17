import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { brandsApi, componentsApi, itemsApi } from '../api/services';
import CreatableSelect from '../components/CreatableSelect';
import ItemDetailModal from '../components/ItemDetailModal';
import type { Brand, Component, Item } from '../types';

function apiMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export default function InventoryPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [componentId, setComponentId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [barcode, setBarcode] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filterComponentId, setFilterComponentId] = useState<number | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null);
  const [filterBrands, setFilterBrands] = useState<Brand[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadComponents = async () => {
    const data = await componentsApi.list();
    setComponents(data);
    return data;
  };

  const loadItems = async () => {
    setItems(await itemsApi.listAll());
  };

  useEffect(() => {
    Promise.all([loadComponents(), loadItems()]).catch(() => setError('Failed to load inventory.'));
  }, []);

  useEffect(() => {
    if (!componentId) {
      setBrands([]);
      setBrandId(null);
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

  const filterComponent = components.find((component) => component.id === filterComponentId) ?? null;
  const visibleItems = items.filter((item) => {
    if (filterBrandId) return item.brandId === filterBrandId;
    if (filterComponent) return item.componentName === filterComponent.name;
    return false;
  });

  const onCreateComponent = async (name: string) => {
    const created = await componentsApi.create({ name });
    const data = await loadComponents();
    const selected = data.find((item) => item.id === created.id) ?? created;
    setComponentId(selected.id);
    setBrandId(null);
    setError('');
    setMessage(`Component "${selected.name}" added.`);
  };

  const onCreateBrand = async (name: string) => {
    if (!componentId) {
      throw new Error('Select a hardware component first.');
    }
    const created = await brandsApi.create(componentId, { name });
    const data = await brandsApi.list(componentId);
    setBrands(data);
    setBrandId(created.id);
    setError('');
    setMessage(`Brand "${created.name}" added.`);
  };

  const resetForm = () => {
    setBarcode('');
  };

  const addItem = async () => {
    if (!componentId) {
      setError('Select or add a hardware component.');
      return;
    }
    if (!brandId) {
      setError('Select or add a brand for this component.');
      return;
    }
    if (!barcode.trim()) {
      setError('Enter a unique barcode for this item.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const item = await itemsApi.create(brandId, {
        uniqueCode: barcode.trim(),
      });
      resetForm();
      await Promise.all([loadComponents(), loadItems()]);
      setFilterComponentId(componentId);
      setFilterBrandId(brandId);
      setMessage(`Saved ${item.uniqueCode} to inventory under ${item.componentName} / ${item.brandName}.`);
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not save this inventory item.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add new hardware that has arrived. Select or create a component and brand, then enter a unique barcode.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <CreatableSelect
            label="1. Hardware Component"
            placeholder="Select component"
            addLabel="Add new component"
            options={components.map((component) => ({ id: component.id, label: component.name }))}
            value={componentId}
            onChange={(id) => {
              setComponentId(id);
              setBrandId(null);
              setError('');
              setMessage('');
            }}
            onCreate={onCreateComponent}
          />

          <ChevronRight className="hidden shrink-0 text-[var(--muted)] xl:mb-3 xl:block" size={18} />

          <CreatableSelect
            label="2. Brand"
            placeholder={componentId ? 'Select brand' : 'Select a component first'}
            addLabel="Add new brand"
            options={brands.map((brand) => ({ id: brand.id, label: brand.name }))}
            value={brandId}
            disabled={!componentId}
            onChange={(id) => {
              setBrandId(id);
              setError('');
              setMessage('');
            }}
            onCreate={onCreateBrand}
          />

          <ChevronRight className="hidden shrink-0 text-[var(--muted)] xl:mb-3 xl:block" size={18} />

          <label className="block min-w-[160px] flex-1 text-sm">
            <span className="mb-1 block font-medium">3. Barcode</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2 uppercase"
              placeholder="Unique barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void addItem();
                }
              }}
            />
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={() => void addItem()}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white hover:bg-[var(--brand-dark)] disabled:opacity-60 xl:mt-6"
          >
            {busy ? 'Saving...' : 'Add to inventory'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--ok)]">{message}</p>}

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Items by category</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Choose a hardware component, then a brand, to view and update items in that category.
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
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Issued to</th>
                  <th className="px-2 py-2 font-medium">Department</th>
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
                    <td className="px-2 py-3">
                      {item.workingStatus === 'NotWorking' ? 'Not Working' : 'Working'}
                    </td>
                    <td className="px-2 py-3">{item.currentEmployeeName || item.handedTo || 'In stock'}</td>
                    <td className="px-2 py-3">
                      {item.currentEmployeeName || item.handedTo ? item.currentEmployeeDepartment || '—' : '—'}
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
          mode="inventory"
          onClose={() => setSelectedItem(null)}
          onSaved={async () => {
            await loadItems();
            const latest = (await itemsApi.listAll()).find((entry) => entry.id === selectedItem.id);
            if (latest) setSelectedItem(latest);
          }}
        />
      )}
    </div>
  );
}
