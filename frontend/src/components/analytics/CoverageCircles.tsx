import { ProgressCircle } from '@tremor/react';
import type { Dashboard } from '../../types';
import type { CoverageRing } from './dashboardDetails';
import ChartFrame from './ChartFrame';
import { pct } from './palette';

interface Props {
  data: Dashboard;
  onOpen?: (ring?: CoverageRing) => void;
}

export default function CoverageCircles({ data, onOpen }: Props) {
  const staffCovered = pct(data.employeesWithHardware, data.employeeCount);
  const issueRate = pct(data.issuedItems, data.totalItems);
  const healthRate = pct(data.workingItems, data.totalItems);
  const issuedCategories = data.components.filter((component) => component.issuedCount > 0);
  const withSpare = issuedCategories.filter((component) => component.workingStockCount > 0);
  const spareRate = pct(withSpare.length, issuedCategories.length);

  const rings: Array<{
    label: CoverageRing;
    value: number;
    color: 'teal' | 'amber' | 'emerald' | 'sky';
    detail: string;
  }> = [
    {
      label: 'Staff covered',
      value: staffCovered,
      color: 'teal',
      detail: `${data.employeesWithHardware}/${data.employeeCount || 0} hold hardware`,
    },
    {
      label: 'Issued share',
      value: issueRate,
      color: 'amber',
      detail: `${data.issuedItems} of ${data.totalItems} items`,
    },
    {
      label: 'Fleet working',
      value: healthRate,
      color: 'emerald',
      detail: `${data.workingItems} working units`,
    },
    {
      label: 'Spare coverage',
      value: issuedCategories.length ? spareRate : 0,
      color: 'sky',
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
      onOpen={onOpen ? () => onOpen() : undefined}
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {rings.map((ring) => (
          <button
            key={ring.label}
            type="button"
            title={`View ${ring.label} details`}
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.(ring.label);
            }}
            className="flex flex-col items-center rounded-xl p-2 text-center transition hover:bg-[var(--bg)]"
          >
            <ProgressCircle value={ring.value} size="xl" color={ring.color} showAnimation>
              <span className="text-lg font-semibold">{ring.value}%</span>
            </ProgressCircle>
            <p className="mt-3 text-sm font-medium">{ring.label}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{ring.detail}</p>
          </button>
        ))}
      </div>
    </ChartFrame>
  );
}
