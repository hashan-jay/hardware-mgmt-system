import { ResponsivePie } from '@nivo/pie';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { muted, palette } from './palette';

interface Props {
  data: Dashboard;
  onOpen?: (slice?: { slice?: string; brandId?: number }) => void;
}

export default function BrandShareDonut({ data, onOpen }: Props) {
  const brands = data.brandShares ?? [];
  const slices = brands.map((brand) => ({
    id: String(brand.id),
    label: brand.name,
    value: brand.itemCount,
  }));

  const openBrand = (id: string) => {
    const brand = brands.find((entry) => String(entry.id) === id);
    onOpen?.(brand ? { slice: `${brand.name} · ${brand.componentName}`, brandId: brand.id } : {});
  };

  return (
    <ChartFrame
      title="Items by brand"
      caption="Click a slice or legend item to see every unit under that brand."
      onOpen={onOpen ? () => onOpen() : undefined}
    >
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">No branded items in inventory yet.</p>
      ) : (
        <div className="h-72 cursor-pointer [&_path]:cursor-pointer" onClick={(event) => event.stopPropagation()}>
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
            onClick={(datum, event) => {
              event.stopPropagation();
              openBrand(String(datum.id));
            }}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 40,
                itemWidth: 88,
                itemHeight: 16,
                symbolSize: 10,
                symbolShape: 'circle',
                onClick: (datum) => openBrand(String(datum.id)),
              },
            ]}
            tooltip={({ datum }) => {
              const brand = brands.find((entry) => String(entry.id) === String(datum.id));
              return (
                <div className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-xs shadow-sm">
                  <span style={{ color: muted }}>
                    {brand ? `${brand.name} · ${brand.componentName}` : datum.label}
                  </span>
                  {': '}
                  <strong>{datum.value}</strong>
                </div>
              );
            }}
          />
        </div>
      )}
    </ChartFrame>
  );
}
