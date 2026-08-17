import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const palette = ['#0f6b5c', '#d97706', '#0ea5e9', '#15803d', '#b91c1c', '#78716c', '#7c3aed', '#db2777'];

export const ink = '#142033';
export const muted = '#5b6b7f';
export const line = '#d7e0ea';
export const brand = '#0f6b5c';
export const accent = '#d97706';
export const danger = '#b91c1c';
export const ok = '#15803d';
export const sky = '#0ea5e9';

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function readCssVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function useThemePalette() {
  const { theme } = useTheme();

  return useMemo(() => {
    const colors = {
      theme,
      ink: readCssVar('--ink', ink),
      muted: readCssVar('--muted', muted),
      line: readCssVar('--line', line),
      surface: readCssVar('--surface', '#ffffff'),
      bg: readCssVar('--bg', '#f3f5f8'),
      brand,
      accent,
      danger,
      ok,
      sky,
      palette,
    };

    return {
      ...colors,
      nivo: {
        background: 'transparent',
        text: { fill: colors.muted },
        tooltip: {
          container: {
            background: colors.surface,
            color: colors.ink,
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${colors.line}`,
            boxShadow: 'var(--shadow)',
          },
        },
        legends: {
          text: { fill: colors.muted },
        },
      },
    };
  }, [theme]);
}
