import type { ReactNode } from 'react';

interface Props {
  title: string;
  caption: string;
  children: ReactNode;
  className?: string;
  live?: boolean;
}

export default function ChartFrame({ title, caption, children, className = '', live }: Props) {
  return (
    <article className={`rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,107,92,0.1)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" />
            Live
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">{caption}</p>
      {children}
    </article>
  );
}
