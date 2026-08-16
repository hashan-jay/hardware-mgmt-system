import { ResponsivePie } from '@nivo/pie';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { muted, palette } from './palette';

export default function BrandShareDonut({ data }: { data: Dashboard }) {
  const slices = (data.brandShares ?? []).map((brand) => ({
    id: `${brand.name} · ${brand.componentName}`,
    label: brand.name,
    value: brand.itemCount,
  }));

  return (
    <ChartFrame
      title="Items by brand"
      caption="Where units sit by brand. Hover a slice to see the parent category and count."
    >
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No branded items in inventory yet.</p>
      ) : (
        <div className="h-72">
          <ResponsivePie
            data={slices}
            margin={{ top: 12, right: 16, bottom: 48, left: 16 }}
            innerRadius={0.58}
            padAngle={1.6}
            cornerRadius={4}
            activeOuterRadiusOffset={8}
            colors={palette}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={false}
            arcLabelsSkipAngle={18}
            arcLabelsTextColor="#ffffff"
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 40,
                itemWidth: 88,
                itemHeight: 16,
                symbolSize: 10,
                symbolShape: 'circle',
              },
            ]}
            tooltip={({ datum }) => (
              <div className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-xs shadow-sm">
                <span style={{ color: muted }}>{datum.id}</span>
                {': '}
                <strong>{datum.value}</strong>
              </div>
            )}
          />
        </div>
      )}
    </ChartFrame>
  );
}
