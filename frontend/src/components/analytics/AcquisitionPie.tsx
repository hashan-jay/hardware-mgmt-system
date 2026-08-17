import { VictoryLegend, VictoryPie } from 'victory';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { accent, brand, ink, muted } from './palette';

interface Props {
  data: Dashboard;
  onOpen?: (slice?: string) => void;
}

export default function AcquisitionPie({ data, onOpen }: Props) {
  const existing = Math.max(0, data.totalItems - data.newAcquisitionItems);
  const slices = [
    { x: 'New intake', y: data.newAcquisitionItems },
    { x: 'Existing fleet', y: existing },
  ].filter((slice) => slice.y > 0);

  const openSlice = (name: string) => onOpen?.(name);

  return (
    <ChartFrame
      title="New vs existing stock"
      caption="Click a slice or legend item to see those units in a table."
      onOpen={onOpen ? () => onOpen() : undefined}
    >
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No items in inventory yet.</p>
      ) : (
        <div
          className="flex h-72 cursor-pointer flex-col items-center justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <VictoryPie
            data={slices}
            width={280}
            height={220}
            padding={28}
            colorScale={[brand, accent]}
            labels={({ datum }) => `${datum.y}`}
            style={{
              data: { cursor: 'pointer' },
              labels: { fill: ink, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onClick: (_event, props) => {
                    openSlice(String(props.datum.x));
                    return [];
                  },
                },
              },
              {
                target: 'labels',
                eventHandlers: {
                  onClick: (_event, props) => {
                    openSlice(String(props.datum.x));
                    return [];
                  },
                },
              },
            ]}
          />
          <VictoryLegend
            standalone
            orientation="horizontal"
            gutter={16}
            height={32}
            width={280}
            colorScale={[brand, accent]}
            style={{
              labels: { fill: muted, fontSize: 12, cursor: 'pointer' },
              data: { cursor: 'pointer' },
            }}
            data={slices.map((slice) => ({ name: `${slice.x} · ${slice.y}` }))}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onClick: (_event: unknown, props: { index?: number }) => {
                    const slice = slices[props.index ?? 0];
                    if (slice) openSlice(slice.x);
                    return [];
                  },
                },
              },
              {
                target: 'labels',
                eventHandlers: {
                  onClick: (_event: unknown, props: { index?: number }) => {
                    const slice = slices[props.index ?? 0];
                    if (slice) openSlice(slice.x);
                    return [];
                  },
                },
              },
            ]}
          />
        </div>
      )}
    </ChartFrame>
  );
}
