import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/services';
import AcquisitionPie from '../components/analytics/AcquisitionPie';
import BrandShareDonut from '../components/analytics/BrandShareDonut';
import CategorySharePie from '../components/analytics/CategorySharePie';
import CategoryStackChart from '../components/analytics/CategoryStackChart';
import CoverageCircles from '../components/analytics/CoverageCircles';
import DashboardDetailModal from '../components/analytics/DashboardDetailModal';
import EmployeeLoadList from '../components/analytics/EmployeeLoadList';
import KpiCards from '../components/analytics/KpiCards';
import OpsTracker from '../components/analytics/OpsTracker';
import WeeklyTrendChart from '../components/analytics/WeeklyTrendChart';
import type { DashboardDetail } from '../components/analytics/dashboardDetails';
import LivePieChart from '../components/LivePieChart';
import type { Dashboard } from '../types';
import { pct } from '../components/analytics/palette';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [detail, setDetail] = useState<DashboardDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async (initial = false) => {
      try {
        const next = await dashboardApi.get();
        if (active) {
          setData({
            ...next,
            weeklyTrend: next.weeklyTrend ?? [],
            dailyPulse: next.dailyPulse ?? [],
            brandShares: next.brandShares ?? [],
            recentScans: next.recentScans ?? [],
            activityPulse: next.activityPulse ?? [],
          });
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

  const failRate = pct(data.notWorkingItems, data.totalItems);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Decision board for office hardware: what can be issued today, what needs repair, and where stock is missing.
        </p>
      </header>

      <KpiCards data={data} onOpen={(kind) => setDetail({ kind })} />

      <section className="grid gap-4 xl:grid-cols-3">
        <LivePieChart
          title="Deployment mix"
          caption="Click the card for the full list, or a segment for that slice."
          data={[
            { name: 'Issued', value: data.issuedItems },
            { name: 'In stock', value: data.inStockItems },
          ]}
          colors={['teal', 'amber']}
          centerLabel={`${data.totalItems} total`}
          onOpen={(slice) => setDetail({ kind: 'deployment-mix', slice })}
        />
        <LivePieChart
          title="Fleet health"
          caption="Click the card for the full list, or a segment for that slice."
          data={[
            { name: 'Working', value: data.workingItems },
            { name: 'Not working', value: data.notWorkingItems },
          ]}
          colors={['emerald', 'rose']}
          centerLabel={`${failRate}% not working`}
          onOpen={(slice) => setDetail({ kind: 'fleet-health', slice })}
        />
        <LivePieChart
          title="Action state"
          caption="Click the card for the full list, or a segment for that slice."
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
          onOpen={(slice) => setDetail({ kind: 'action-state', slice })}
        />
      </section>

      <CoverageCircles data={data} onOpen={(ring) => setDetail({ kind: 'coverage', ring })} />

      <section className="grid gap-4 xl:grid-cols-3">
        <CategorySharePie data={data} onOpen={(slice) => setDetail({ kind: 'category', slice })} />
        <BrandShareDonut
          data={data}
          onOpen={(slice) => setDetail({ kind: 'brand', slice: slice?.slice, brandId: slice?.brandId })}
        />
        <AcquisitionPie data={data} onOpen={(slice) => setDetail({ kind: 'acquisition', slice })} />
      </section>

      <OpsTracker data={data} />
      <CategoryStackChart data={data} />
      <WeeklyTrendChart data={data} />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-lg font-semibold">What to do next</h3>
          <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
            Ranked from the live mix of issued, stock, working status, and the last four weeks of intake vs issues.
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
        <EmployeeLoadList data={data} />
      </section>

      {detail ? <DashboardDetailModal detail={detail} data={data} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
