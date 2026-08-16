import { VictoryLegend, VictoryPie } from 'victory';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { accent, brand, ink, muted } from './palette';

export default function AcquisitionPie({ data }: { data: Dashboard }) {
  const existing = Math.max(0, data.totalItems - data.newAcquisitionItems);
  const slices = [
    { x: 'New intake', y: data.newAcquisitionItems },
    { x: 'Existing fleet', y: existing },
  ].filter((slice) => slice.y > 0);

  return (
    <ChartFrame
      title="New vs existing stock"
      caption="New acquisitions versus units already on the books. Use this when deciding whether intake is refreshing the fleet."
    >
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No items in inventory yet.</p>
      ) : (
        <div className="flex h-72 flex-col items-center justify-center">
          <VictoryPie
            data={slices}
            width={280}
            height={220}
            padding={28}
            colorScale={[brand, accent]}
            labels={({ datum }) => `${datum.y}`}
            style={{
              labels: { fill: ink, fontSize: 14, fontWeight: 600 },
            }}
          />
          <VictoryLegend
            standalone
            orientation="horizontal"
            gutter={16}
            height={32}
            width={280}
            colorScale={[brand, accent]}
            style={{ labels: { fill: muted, fontSize: 12 } }}
            data={slices.map((slice) => ({ name: `${slice.x} · ${slice.y}` }))}
          />
        </div>
      )}
    </ChartFrame>
  );
}
