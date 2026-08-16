import { VictoryArea } from 'victory';

interface Props {
  values: number[];
  color: string;
}

export default function Sparkline({ values, color }: Props) {
  const points = (values.length > 0 ? values : [0]).map((y, x) => ({ x, y }));
  const max = Math.max(1, ...points.map((point) => point.y));

  return (
    <svg viewBox="0 0 132 40" className="mt-3 h-10 w-full" role="img" aria-hidden>
      <VictoryArea
        standalone={false}
        width={132}
        height={40}
        padding={{ top: 6, bottom: 2, left: 2, right: 2 }}
        data={points}
        domain={{ x: [0, Math.max(1, points.length - 1)], y: [0, max] }}
        interpolation="monotoneX"
        style={{
          data: {
            fill: color,
            fillOpacity: 0.16,
            stroke: color,
            strokeWidth: 2,
          },
        }}
      />
    </svg>
  );
}
