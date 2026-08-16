import { ProgressCircle } from '@tremor/react';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { pct } from './palette';

export default function CoverageCircles({ data }: { data: Dashboard }) {
  const staffCovered = pct(data.employeesWithHardware, data.employeeCount);
  const issueRate = pct(data.issuedItems, data.totalItems);
  const healthRate = pct(data.workingItems, data.totalItems);
  const issuedCategories = data.components.filter((component) => component.issuedCount > 0);
  const withSpare = issuedCategories.filter((component) => component.workingStockCount > 0);
  const spareRate = pct(withSpare.length, issuedCategories.length);

  const rings = [
    {
      label: 'Staff covered',
      value: staffCovered,
      color: 'teal' as const,
      detail: `${data.employeesWithHardware}/${data.employeeCount || 0} hold hardware`,
    },
    {
      label: 'Issued share',
      value: issueRate,
      color: 'amber' as const,
      detail: `${data.issuedItems} of ${data.totalItems} items`,
    },
    {
      label: 'Fleet working',
      value: healthRate,
      color: 'emerald' as const,
      detail: `${data.workingItems} working units`,
    },
    {
      label: 'Spare coverage',
      value: issuedCategories.length ? spareRate : 0,
      color: 'sky' as const,
      detail: issuedCategories.length
        ? `${withSpare.length}/${issuedCategories.length} issued categories have a spare`
        : 'No issued categories yet',
    },
  ];

  return (
    <ChartFrame
      title="Coverage rings"
      caption="Progress against the live fleet: who has hardware, how much is out, health, and whether issued categories still have a working spare."
      live
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {rings.map((ring) => (
          <div key={ring.label} className="flex flex-col items-center text-center">
            <ProgressCircle value={ring.value} size="xl" color={ring.color} showAnimation>
              <span className="text-lg font-semibold">{ring.value}%</span>
            </ProgressCircle>
            <p className="mt-3 text-sm font-medium">{ring.label}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{ring.detail}</p>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
