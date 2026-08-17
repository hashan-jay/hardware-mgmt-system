import { BarList } from '@tremor/react';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { pct } from './palette';

export default function EmployeeLoadList({ data }: { data: Dashboard }) {
  const staffCovered = pct(data.employeesWithHardware, data.employeeCount);
  const rows = data.holders.map((holder) => ({
    name: holder.departmentName ? `${holder.fullName} · ${holder.departmentName}` : holder.fullName,
    value: holder.itemCount,
  }));

  return (
    <ChartFrame
      title="Hardware with people"
      caption={`${staffCovered}% of employees currently hold at least one item.`}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No items issued yet.</p>
      ) : (
        <BarList data={rows} color="teal" />
      )}
    </ChartFrame>
  );
}
