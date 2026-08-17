import { ResponsivePie } from '@nivo/pie';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { palette, useThemePalette } from './palette';

interface Props {
  data: Dashboard;
  onOpen?: (slice?: string) => void;
}

export default function CategorySharePie({ data, onOpen }: Props) {
  const colors = useThemePalette();
  const slices = data.components
    .filter((component) => component.itemCount > 0)
    .map((component) => ({
      id: component.name,
      label: component.name,
      value: component.itemCount,
    }));

  return (
    <ChartFrame
      title="Items by category"
      caption="Click a slice or legend item to see every unit in that category."
      onOpen={onOpen ? () => onOpen() : undefined}
    >
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No items in inventory yet.</p>
      ) : (
        <div className="h-72 cursor-pointer [&_path]:cursor-pointer" onClick={(event) => event.stopPropagation()}>
          <ResponsivePie
            data={slices}
            theme={colors.nivo}
            margin={{ top: 12, right: 16, bottom: 48, left: 16 }}
            innerRadius={0}
            padAngle={1.4}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={palette}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={slices.length <= 6}
            arcLinkLabelsSkipAngle={12}
            arcLinkLabelsTextColor={colors.muted}
            arcLinkLabelsThickness={1}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={16}
            arcLabelsTextColor="#ffffff"
            onClick={(datum, event) => {
              event.stopPropagation();
              onOpen?.(String(datum.id));
            }}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 40,
                itemWidth: 96,
                itemHeight: 16,
                symbolSize: 10,
                symbolShape: 'circle',
                itemTextColor: colors.muted,
                onClick: (datum) => onOpen?.(String(datum.id)),
              },
            ]}
          />
        </div>
      )}
    </ChartFrame>
  );
}
