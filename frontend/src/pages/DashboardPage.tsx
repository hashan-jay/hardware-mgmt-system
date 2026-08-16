import { useEffect, useState } from 'react';
import { AlertTriangle, PackageCheck, ShieldAlert, Users } from 'lucide-react';
import { dashboardApi } from '../api/services';
import LivePieChart from '../components/LivePieChart';
import type { ComponentAnalytics, Dashboard } from '../types';

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function readiness(component: ComponentAnalytics) {
  if (component.itemCount === 0) return { label: 'No inventory', tone: 'empty' as const };
  if (component.issuedNotWorkingCount > 0) return { label: 'Repair needed', tone: 'danger' as const };
  if (component.issuedCount > 0 && component.workingStockCount === 0)
    return { label: 'No spare', tone: 'warn' as const };
  if (component.workingStockCount > 0) return { label: 'Ready to issue', tone: 'ok' as const };
  return { label: 'All issued', tone: 'warn' as const };
}

function StackedBar({
  segments,
}: {
  segments: Array<{ value: number; color: string; label: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[var(--bg)]">
        {total === 0 ? (
          <span className="block h-full w-full bg-[var(--line)]" />
        ) : (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <span
                key={segment.label}
                className="block h-full"
                style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
                title={`${segment.label}: ${segment.value}`}
              />
            ))
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
            {segment.label} {segment.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async (initial = false) => {
      try {
        const next = await dashboardApi.get();
        if (active) {
          setData(next);
          setError('');
        }
      } catch {
        if (active && initial) setError('Failed to load dashboard.');
      }
    };

    void load(true);
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!data) return <p className="text-[var(--muted)]">Loading dashboard...</p>;

  const issueRate = pct(data.issuedItems, data.totalItems);
  const failRate = pct(data.notWorkingItems, data.totalItems);
  const staffCovered = pct(data.employeesWithHardware, data.employeeCount);
  const maxHold = Math.max(1, ...data.holders.map((holder) => holder.itemCount));
  const stocked = data.components.filter((component) => component.itemCount > 0);
  const empty = data.components.filter((component) => component.itemCount === 0);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Decision board for office hardware: what can be issued today, what needs repair, and where stock is missing.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <ShieldAlert size={16} className="text-[var(--danger)]" />
            Issued not working
          </div>
          <p className={`mt-2 text-3xl font-semibold ${data.issuedNotWorkingItems ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
            {data.issuedNotWorkingItems}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Staff blocked until repaired or replaced</p>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <PackageCheck size={16} className="text-[var(--ok)]" />
            Ready to issue
          </div>
          <p className="mt-2 text-3xl font-semibold text-[var(--ok)]">{data.workingStockItems}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Working units still in stock</p>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Users size={16} className="text-[var(--brand)]" />
            Issued to staff
          </div>
          <p className="mt-2 text-3xl font-semibold">{data.issuedItems}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {issueRate}% of {data.totalItems} items · {data.employeesWithHardware}/{data.employeeCount || 0} employees
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <AlertTriangle size={16} className="text-[var(--accent)]" />
            Failure rate
          </div>
          <p className={`mt-2 text-3xl font-semibold ${failRate ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
            {failRate}%
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {data.notWorkingItems} not working of {data.totalItems} total
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <LivePieChart
          title="Deployment mix"
          caption="Issued vs sitting in inventory. Click a slice to inspect the share."
          data={[
            { name: 'Issued', value: data.issuedItems },
            { name: 'In stock', value: data.inStockItems },
          ]}
          colors={['teal', 'amber']}
          centerLabel={`${data.totalItems} total`}
        />
        <LivePieChart
          title="Fleet health"
          caption="Working vs not working across the office fleet."
          data={[
            { name: 'Working', value: data.workingItems },
            { name: 'Not working', value: data.notWorkingItems },
          ]}
          colors={['emerald', 'rose']}
          centerLabel={`${failRate}% not working`}
        />
        <LivePieChart
          title="Action state"
          caption="What you can issue today, what is already out, and what needs repair."
          data={[
            { name: 'Ready to issue', value: data.workingStockItems },
            {
              name: 'Issued and working',
              value: Math.max(0, data.issuedItems - data.issuedNotWorkingItems),
            },
            { name: 'Needs repair', value: data.notWorkingItems },
          ]}
          colors={['sky', 'teal', 'rose']}
          centerLabel={`${data.workingStockItems} ready`}
        />
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Issue readiness by category</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Use this to decide what to buy next and what can be issued today.
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {data.componentCount} categories · {data.brandCount} brands · {data.activeScanCount} active scans
          </p>
        </div>

        {stocked.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No items in inventory yet.</p>
        ) : (
          <div className="space-y-4">
            {stocked.map((component) => {
              const status = readiness(component);
              return (
                <div key={component.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{component.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        status.tone === 'ok'
                          ? 'bg-[rgba(21,128,61,0.12)] text-[var(--ok)]'
                          : status.tone === 'danger'
                            ? 'bg-[rgba(185,28,28,0.12)] text-[var(--danger)]'
                            : 'bg-[rgba(217,119,6,0.14)] text-[var(--accent)]'
                      }`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <StackedBar
                    segments={[
                      {
                        value: component.issuedCount - component.issuedNotWorkingCount,
                        color: 'var(--brand)',
                        label: 'Issued',
                      },
                      {
                        value: component.issuedNotWorkingCount,
                        color: 'var(--danger)',
                        label: 'Issued not working',
                      },
                      { value: component.workingStockCount, color: 'var(--ok)', label: 'Working spare' },
                      {
                        value: Math.max(0, component.inStockCount - component.workingStockCount),
                        color: 'var(--accent)',
                        label: 'Broken in stock',
                      },
                    ]}
                  />
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {component.itemCount} items · {component.workingStockCount} ready spare
                    {component.issuedNotWorkingCount
                      ? ` · ${component.issuedNotWorkingCount} issued not working`
                      : ''}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {empty.length > 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] p-4">
            <p className="text-sm font-medium">Registered with no stock</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {empty.map((component) => component.name).join(', ')}. Add units in Inventory when they arrive.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">What to do next</h3>
          <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
            Ranked from the live mix of issued, stock, and working status.
          </p>
          {data.insights.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No actions suggested.</p>
          ) : (
            <ol className="space-y-3">
              {data.insights.map((insight, index) => (
                <li key={insight} className="flex gap-3 text-sm">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--bg)] text-xs font-semibold text-[var(--brand)]">
                    {index + 1}
                  </span>
                  <span>{insight}</span>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Hardware with people</h3>
          <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
            {staffCovered}% of employees currently hold at least one item.
          </p>
          {data.holders.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No items issued yet.</p>
          ) : (
            <div className="space-y-3">
              {data.holders.map((holder) => (
                <div key={holder.employeeId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{holder.fullName}</span>
                    <span className="text-[var(--muted)]">{holder.itemCount}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                    <span
                      className="block h-full rounded-full bg-[var(--brand)]"
                      style={{ width: `${(holder.itemCount / maxHold) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
