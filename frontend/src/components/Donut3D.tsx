import { useId, useMemo, useState } from 'react';
import type { Color } from '@tremor/react';

export interface DonutSlice {
  name: string;
  value: number;
  color: Color;
}

interface Props {
  slices: DonutSlice[];
  selectedName?: string | null;
  onSelect: (name: string | null) => void;
  centerValue: string;
  centerHint: string;
}

interface Palette {
  top: string;
  light: string;
  wall: string;
  inner: string;
}

const palettes: Record<string, Palette> = {
  teal: { top: '#1aa38c', light: '#7ee0cd', wall: '#08463c', inner: '#0c5c50' },
  amber: { top: '#f0a202', light: '#ffe08a', wall: '#92400e', inner: '#d97706' },
  emerald: { top: '#10b981', light: '#6ee7b7', wall: '#065f46', inner: '#047857' },
  rose: { top: '#f43f5e', light: '#fda4af', wall: '#9f1239', inner: '#e11d48' },
  sky: { top: '#0ea5e9', light: '#7dd3fc', wall: '#075985', inner: '#0284c7' },
  stone: { top: '#a8a29e', light: '#e7e5e4', wall: '#44403c', inner: '#78716c' },
};

const CX = 120;
const CY = 108;
const OUTER = 78;
const INNER = 44;
const DEPTH = 18;
const GAP = 2.4;

function token(name: string) {
  return name.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function toRad(angle: number) {
  return ((angle - 90) * Math.PI) / 180;
}

function pt(radius: number, angle: number, yOffset = 0) {
  const rad = toRad(angle);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) + yOffset };
}

function topPath(a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const outer0 = pt(OUTER, a0);
  const outer1 = pt(OUTER, a1);
  const inner1 = pt(INNER, a1);
  const inner0 = pt(INNER, a0);
  return `M ${outer0.x} ${outer0.y} A ${OUTER} ${OUTER} 0 ${large} 1 ${outer1.x} ${outer1.y} L ${inner1.x} ${inner1.y} A ${INNER} ${INNER} 0 ${large} 0 ${inner0.x} ${inner0.y} Z`;
}

function wallPath(radius: number, a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const top0 = pt(radius, a0);
  const top1 = pt(radius, a1);
  const bot0 = pt(radius, a0, DEPTH);
  const bot1 = pt(radius, a1, DEPTH);
  return `M ${top0.x} ${top0.y} L ${bot0.x} ${bot0.y} A ${radius} ${radius} 0 ${large} 1 ${bot1.x} ${bot1.y} L ${top1.x} ${top1.y} A ${radius} ${radius} 0 ${large} 0 ${top0.x} ${top0.y} Z`;
}

function splitFullCircle(a0: number, a1: number) {
  if (a1 - a0 < 359.2) return [{ a0, a1 }];
  return [
    { a0, a1: a0 + 180 },
    { a0: a0 + 180, a1: a0 + 360 },
  ];
}

export default function Donut3D({ slices, selectedName, onSelect, centerValue, centerHint }: Props) {
  const uid = useId().replace(/:/g, '');
  const [hovered, setHovered] = useState<string | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const segments = useMemo(() => {
    if (!total) return [];
    const gap = slices.length > 1 ? GAP : 0;
    let cursor = 0;
    return slices.flatMap((slice) => {
      const sweep = (slice.value / total) * 360;
      const a0 = cursor + gap / 2;
      const a1 = cursor + sweep - gap / 2;
      cursor += sweep;
      const mid = (a0 + a1) / 2;
      return splitFullCircle(a0, Math.max(a0 + 0.4, a1)).map((part, partIndex) => ({
        ...slice,
        a0: part.a0,
        a1: part.a1,
        mid,
        partIndex,
      }));
    });
  }, [slices, total]);

  const orderedWalls = [...segments].sort(
    (left, right) => Math.sin(toRad(left.mid)) - Math.sin(toRad(right.mid)),
  );

  return (
    <div className="donut-3d-scene">
      <div className="donut-3d-stage">
        <svg viewBox="0 0 240 230" className="h-56 w-56 overflow-visible">
          <defs>
            <filter id={`${uid}-shadow`} x="-30%" y="-20%" width="160%" height="170%">
              <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#142033" floodOpacity="0.22" />
            </filter>
            {slices.map((slice) => {
              const palette = palettes[slice.color] ?? palettes.teal;
              return (
                <linearGradient
                  key={slice.name}
                  id={`${uid}-${token(slice.name)}`}
                  x1="18%"
                  y1="8%"
                  x2="88%"
                  y2="92%"
                >
                  <stop offset="0%" stopColor={palette.light} />
                  <stop offset="46%" stopColor={palette.top} />
                  <stop offset="100%" stopColor={palette.inner} />
                </linearGradient>
              );
            })}
          </defs>

          <ellipse cx={CX} cy={CY + DEPTH + 12} rx={OUTER - 4} ry="13" fill="#142033" opacity="0.14" />

          <g filter={`url(#${uid}-shadow)`}>
            {orderedWalls.map((segment) => {
              const palette = palettes[segment.color] ?? palettes.teal;
              const explode = selectedName === segment.name ? 8 : hovered === segment.name ? 4 : 0;
              const dx = Math.cos(toRad(segment.mid)) * explode;
              const dy = Math.sin(toRad(segment.mid)) * explode * 0.5;
              return (
                <g key={`wall-${segment.name}-${segment.partIndex}`} transform={`translate(${dx} ${dy})`}>
                  <path d={wallPath(OUTER, segment.a0, segment.a1)} fill={palette.wall} />
                  <path d={wallPath(INNER, segment.a0, segment.a1)} fill={palette.inner} opacity="0.92" />
                </g>
              );
            })}

            {segments.map((segment) => {
              const explode = selectedName === segment.name ? 8 : hovered === segment.name ? 4 : 0;
              const dx = Math.cos(toRad(segment.mid)) * explode;
              const dy = Math.sin(toRad(segment.mid)) * explode * 0.5;
              const dimmed = Boolean(selectedName && selectedName !== segment.name);
              return (
                <path
                  key={`top-${segment.name}-${segment.partIndex}`}
                  d={topPath(segment.a0, segment.a1)}
                  fill={`url(#${uid}-${token(segment.name)})`}
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth="1.15"
                  opacity={dimmed ? 0.52 : 1}
                  transform={`translate(${dx} ${dy})`}
                  className="donut-3d-slice"
                  onMouseEnter={() => setHovered(segment.name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(selectedName === segment.name ? null : segment.name)}
                >
                  <title>{`${segment.name}: ${segment.value}`}</title>
                </path>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center">
        <p className="text-3xl font-semibold tracking-tight text-[var(--ink)]">{centerValue}</p>
        <p className="mx-auto mt-0.5 max-w-[8rem] text-[11px] leading-tight text-[var(--muted)]">{centerHint}</p>
      </div>
    </div>
  );
}
