import type { ReactNode } from 'react';

interface Props {
  title: string;
  caption: string;
  children: ReactNode;
  className?: string;
  live?: boolean;
  onOpen?: () => void;
}

export default function ChartFrame({ title, caption, children, className = '', live, onOpen }: Props) {
  return (
    <article
      className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm ${className} ${
        onOpen ? 'cursor-pointer transition hover:border-teal-300 hover:shadow-md dark:hover:border-teal-500' : ''
      }`}
      title={onOpen ? `View ${title} details` : undefined}
      onClick={onOpen}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand)]">
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
