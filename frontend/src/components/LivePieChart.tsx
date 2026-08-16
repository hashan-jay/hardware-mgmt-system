import { useState } from 'react';
import { DonutChart, Legend, type Color, type EventProps } from '@tremor/react';

export interface PieSlice {
  name: string;
  value: number;
}

interface Props {
  title: string;
  caption: string;
  data: PieSlice[];
  colors: Color[];
  centerLabel?: string;
}

const formatCount = (value: number) => `${value} item${value === 1 ? '' : 's'}`;

function sliceName(value: EventProps): string | undefined {
  if (!value) return undefined;
  if (typeof value.name === 'string') return value.name;
  return value.categoryClicked;
}

export default function LivePieChart({ title, caption, data, colors, centerLabel }: Props) {
  const [selected, setSelected] = useState<EventProps>(null);
  const slices = data.filter((slice) => slice.value > 0);
  const categories = slices.map((slice) => slice.name);
  const selectedSlice = slices.find((slice) => slice.name === sliceName(selected));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,107,92,0.1)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" />
          Live
        </span>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">{caption}</p>
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No values to chart yet.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
          <DonutChart
            data={slices}
            index="name"
            category="value"
            variant="pie"
            colors={colors.slice(0, slices.length)}
            showAnimation
            animationDuration={700}
            showLabel={false}
            valueFormatter={formatCount}
            className="h-48 w-48"
            onValueChange={setSelected}
            noDataText="No values to chart yet."
          />
          <div className="min-w-[9rem]">
            <Legend categories={categories} colors={colors.slice(0, slices.length)} className="max-w-xs" />
            <p className="mt-3 text-sm text-[var(--ink)]">
              {selectedSlice ? (
                <>
                  <span className="font-semibold">{selectedSlice.name}</span>
                  <span className="text-[var(--muted)]">
                    {' '}
                    {selectedSlice.value} · {total ? Math.round((selectedSlice.value / total) * 100) : 0}%
                  </span>
                </>
              ) : (
                <span className="text-[var(--muted)]">{centerLabel ?? 'Click a slice for the share'}</span>
              )}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
