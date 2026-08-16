import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { accent, brand, danger, muted, ok } from './palette';

export default function CategoryStackChart({ data }: { data: Dashboard }) {
  const stocked = data.components.filter((component) => component.itemCount > 0);
  const empty = data.components.filter((component) => component.itemCount === 0);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: 0,
        textStyle: { color: muted, fontSize: 11 },
      },
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: '#e8eef4' } },
      },
      yAxis: {
        type: 'category',
        data: stocked.map((component) => component.name),
        inverse: true,
        axisLabel: { color: '#142033', fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Issued working',
          type: 'bar',
          stack: 'fleet',
          barMaxWidth: 22,
          data: stocked.map((component) =>
            Math.max(0, component.issuedCount - component.issuedNotWorkingCount),
          ),
          itemStyle: { color: brand, borderRadius: [0, 0, 0, 0] },
        },
        {
          name: 'Issued not working',
          type: 'bar',
          stack: 'fleet',
          barMaxWidth: 22,
          data: stocked.map((component) => component.issuedNotWorkingCount),
          itemStyle: { color: danger },
        },
        {
          name: 'Working spare',
          type: 'bar',
          stack: 'fleet',
          barMaxWidth: 22,
          data: stocked.map((component) => component.workingStockCount),
          itemStyle: { color: ok },
        },
        {
          name: 'Broken in stock',
          type: 'bar',
          stack: 'fleet',
          barMaxWidth: 22,
          data: stocked.map((component) =>
            Math.max(0, component.inStockCount - component.workingStockCount),
          ),
          itemStyle: { color: accent, borderRadius: [0, 4, 4, 0] },
        },
      ],
    }),
    [stocked],
  );

  return (
    <ChartFrame
      title="Issue readiness by category"
      caption="Stacked issued vs stock vs repair. Use this to decide what can go out today and what to buy next."
    >
      <div className="mb-3 text-xs text-[var(--muted)]">
        {data.componentCount} categories · {data.brandCount} brands · {data.activeScanCount} scanned today
      </div>
      {stocked.length === 0 ? (
        <p className="py-8 text-sm text-[var(--muted)]">No items in inventory yet.</p>
      ) : (
        <ReactECharts option={option} style={{ height: Math.max(280, stocked.length * 56) }} notMerge lazyUpdate />
      )}
      {empty.length > 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] p-4">
          <p className="text-sm font-medium">Registered with no stock</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {empty.map((component) => component.name).join(', ')}. Add units in Inventory when they arrive.
          </p>
        </div>
      )}
    </ChartFrame>
  );
}
