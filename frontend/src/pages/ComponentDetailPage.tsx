import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { brandsApi, componentsApi } from '../api/services';
import type { ComponentDetail } from '../types';

export default function ComponentDetailPage() {
  const { id } = useParams();
  const componentId = Number(id);
  const [component, setComponent] = useState<ComponentDetail | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const data = await componentsApi.get(componentId);
    setComponent(data);
  };

  useEffect(() => {
    if (!componentId) return;
    load().catch(() => setError('Failed to load component.'));
  }, [componentId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await brandsApi.create(componentId, { name });
      setName('');
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not create brand.';
      setError(message);
    }
  };

  const onDelete = async (brandId: number, label: string) => {
    if (!confirm(`Delete brand "${label}" and all its items?`)) return;
    try {
      await brandsApi.remove(brandId);
      await load();
    } catch {
      setError('Could not delete this brand.');
    }
  };

  if (!component) return <p className="text-[var(--muted)]">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/inventory" className="text-sm text-[var(--brand)] hover:underline">
          ← Back to inventory
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">{component.name}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Brands for this component. Register items from Inventory, or add another brand here.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-[1fr_auto]"
      >
        <input
          placeholder="Brand name (e.g. MSI)"
          className="rounded-lg border border-[var(--line)] px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white">
          Add Brand
        </button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {component.brands.map((brand) => (
          <article
            key={brand.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <h3 className="text-lg font-semibold">{brand.name}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{brand.itemCount} items</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/brands/${brand.id}`}
                className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm text-white"
              >
                Open brand
              </Link>
              <button
                onClick={() => onDelete(brand.id, brand.name)}
                className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-sm text-[var(--danger)]"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
