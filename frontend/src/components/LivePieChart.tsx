import { useState } from 'react';
import type { Color } from '@tremor/react';
import Donut3D from './Donut3D';

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

const colorFill: Record<string, string> = {
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  stone: 'bg-stone-500',
};

export default function LivePieChart({ title, caption, data, colors, centerLabel }: Props) {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const slices = data.filter((slice) => slice.value > 0);
  const selectedSlice = slices.find((slice) => slice.name === selectedName);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const share = selectedSlice && total ? Math.round((selectedSlice.value / total) * 100) : null;

  const donutSlices = slices.map((slice, index) => ({
    ...slice,
    color: colors[index] ?? 'teal',
  }));

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
        <div className="flex flex-col items-center">
          <Donut3D
            slices={donutSlices}
            selectedName={selectedName}
            onSelect={setSelectedName}
            centerValue={selectedSlice ? `${share}%` : String(total)}
            centerHint={
              selectedSlice ? `${selectedSlice.name} · ${selectedSlice.value}` : centerLabel ?? 'Click a ring'
            }
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {slices.map((slice, index) => {
              const active = selectedName === slice.name;
              return (
                <button
                  key={slice.name}
                  type="button"
                  onClick={() => setSelectedName(active ? null : slice.name)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                    active
                      ? 'border-[var(--brand)] bg-[rgba(15,107,92,0.08)] font-medium text-[var(--ink)]'
                      : 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${colorFill[colors[index] ?? 'teal'] ?? 'bg-teal-500'}`}
                  />
                  {slice.name}
                  <span className="tabular-nums">{slice.value}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
