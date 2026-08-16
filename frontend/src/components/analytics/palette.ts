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
