import { ResponsivePie } from '@nivo/pie';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { muted, palette } from './palette';

export default function CategorySharePie({ data }: { data: Dashboard }) {
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
      caption="Share of the live inventory, so buying and scanning effort follows where the fleet actually sits."
    >
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No items in inventory yet.</p>
      ) : (
        <div className="h-72">
          <ResponsivePie
            data={slices}
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
            arcLinkLabelsTextColor={muted}
            arcLinkLabelsThickness={1}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={16}
            arcLabelsTextColor="#ffffff"
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 40,
                itemWidth: 96,
                itemHeight: 16,
                symbolSize: 10,
                symbolShape: 'circle',
              },
            ]}
          />
        </div>
      )}
    </ChartFrame>
  );
}
