import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';
import { accent, brand, sky, useThemePalette } from './palette';

export default function WeeklyTrendChart({ data }: { data: Dashboard }) {
  const colors = useThemePalette();
  const rows = data.weeklyTrend ?? [];
  const hasSignal = rows.some((row) => row.added + row.issued + row.reissued > 0);

  return (
    <ChartFrame
      title="Weekly intake vs first issues"
      caption="Items added to inventory versus first assignment to an employee. Reissues are current holder changes, not new stock leaving the shelf."
    >
      {!hasSignal ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">
          No additions or issues in the last 12 weeks yet. New inventory and first issues will plot here.
        </p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={colors.line} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.line }} />
              <YAxis allowDecimals={false} tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.line }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${colors.line}`,
                  background: colors.surface,
                  color: colors.ink,
                  fontSize: 12,
                }}
                labelStyle={{ color: colors.ink }}
                itemStyle={{ color: colors.ink }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.muted }} />
              <Area
                type="monotone"
                dataKey="added"
                name="Added to inventory"
                stroke={brand}
                fill={brand}
                fillOpacity={0.16}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="issued"
                name="First issued"
                stroke={accent}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="reissued"
                name="Reissued"
                stroke={sky}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}
