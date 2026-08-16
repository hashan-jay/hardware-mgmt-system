import { AlertTriangle, PackageCheck, ShieldAlert, Users } from 'lucide-react';
import { ProgressCircle } from '@tremor/react';
import type { Dashboard } from '../../types';
import { accent, brand, pct } from './palette';
import Sparkline from './Sparkline';

export default function KpiCards({ data }: { data: Dashboard }) {
  const issueRate = pct(data.issuedItems, data.totalItems);
  const failRate = pct(data.notWorkingItems, data.totalItems);
  const blockedShare = pct(data.issuedNotWorkingItems, Math.max(data.issuedItems, 1));
  const addedSpark = (data.dailyPulse ?? []).map((day) => day.added);
  const issuedSpark = (data.dailyPulse ?? []).map((day) => day.issued);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <ShieldAlert size={16} className="text-[var(--danger)]" />
              Issued not working
            </div>
            <p className={`mt-2 text-3xl font-semibold ${data.issuedNotWorkingItems ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
              {data.issuedNotWorkingItems}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Staff blocked until repaired or replaced</p>
          </div>
          <ProgressCircle value={data.issuedItems ? blockedShare : 0} size="md" color="rose">
            <span className="text-[11px] font-semibold text-[var(--danger)]">{blockedShare}%</span>
          </ProgressCircle>
        </div>
      </article>

      <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <PackageCheck size={16} className="text-[var(--ok)]" />
          Ready to issue
        </div>
        <p className="mt-2 text-3xl font-semibold text-[var(--ok)]">{data.workingStockItems}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Working units still in stock · 14-day intake</p>
        <Sparkline values={addedSpark} color={brand} />
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
        <Sparkline values={issuedSpark} color={accent} />
      </article>

      <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
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
          </div>
          <ProgressCircle value={failRate} size="md" color="amber">
            <span className="text-[11px] font-semibold text-[var(--accent)]">{data.notWorkingItems}</span>
          </ProgressCircle>
        </div>
      </article>
    </section>
  );
}
