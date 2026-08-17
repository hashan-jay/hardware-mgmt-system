import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { employeesApi, itemsApi } from '../../api/services';
import type { Dashboard, Employee, Item } from '../../types';
import { pct } from './palette';
import {
  actionState,
  type DashboardDetail,
  detailCopy,
  employeesWithoutHardware,
  filterItems,
  formatDay,
  hasSpareFor,
  holderName,
  isIssued,
  isWorking,
  itemLabel,
  itemsForEmployee,
} from './dashboardDetails';

interface Props {
  detail: DashboardDetail;
  data: Dashboard;
  onClose: () => void;
}

type Tone = 'rose' | 'emerald' | 'teal' | 'amber' | 'sky' | 'stone';

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const styles: Record<Tone, string> = {
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-800',
    teal: 'bg-teal-50 text-teal-800',
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-800',
    stone: 'bg-stone-100 text-stone-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[tone]}`}>{children}</span>
  );
}

function healthBadge(item: Item) {
  return isWorking(item) ? <Badge tone="emerald">Working</Badge> : <Badge tone="rose">Not working</Badge>;
}

function deploymentBadge(item: Item) {
  return isIssued(item) ? <Badge tone="teal">Issued</Badge> : <Badge tone="amber">In stock</Badge>;
}

function actionBadge(item: Item) {
  const state = actionState(item);
  const tone: Tone = state === 'Needs repair' ? 'rose' : state === 'Ready to issue' ? 'sky' : 'teal';
  return <Badge tone={tone}>{state}</Badge>;
}

interface Column {
  key: string;
  header: string;
}

interface TableModel {
  heading?: string;
  empty: string;
  columns: Column[];
  rows: Array<{ id: string; tone?: Tone; cells: Record<string, ReactNode> }>;
}

export default function DashboardDetailModal({ detail, data, onClose }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const isInPanel = (target: EventTarget | null) => {
      const panel = scrollRef.current;
      return Boolean(panel && target instanceof Node && panel.contains(target));
    };

    const onWheel = (event: WheelEvent) => {
      const panel = scrollRef.current;
      if (!panel) {
        event.preventDefault();
        return;
      }

      const overPanel = isInPanel(event.target);
      const canScroll = panel.scrollHeight > panel.clientHeight + 1;
      const atTop = panel.scrollTop <= 0 && event.deltaY < 0;
      const atBottom =
        panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1 && event.deltaY > 0;

      if (overPanel && canScroll && !atTop && !atBottom) return;

      event.preventDefault();
      if (canScroll && !atTop && !atBottom) {
        panel.scrollTop += event.deltaY;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isInPanel(event.target)) event.preventDefault();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([itemsApi.listAll(), employeesApi.list()])
      .then(([nextItems, nextEmployees]) => {
        if (!active) return;
        setItems(nextItems);
        setEmployees(nextEmployees);
      })
      .catch(() => {
        if (active) setError('Failed to load the detailed list.');
      });
    return () => {
      active = false;
    };
  }, []);

  const { title, caption } = detailCopy(detail, data);
  const tables = useMemo(
    () => (items ? buildTables(detail, data, items, employees) : []),
    [detail, data, items, employees],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-detail-title"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden overscroll-none rounded-2xl border border-[var(--line)] bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] px-6 py-5">
          <div>
            <h3 id="dashboard-detail-title" className="text-xl font-semibold">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{caption}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] p-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {error ? (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          ) : !items ? (
            <p className="text-sm text-[var(--muted)]">Loading details...</p>
          ) : (
            <div className="space-y-6">
              {tables.map((table) => (
                <section key={table.heading ?? title}>
                  {table.heading ? <h4 className="mb-3 text-sm font-semibold">{table.heading}</h4> : null}
                  {table.rows.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">{table.empty}</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-[var(--bg)] text-[var(--muted)]">
                          <tr>
                            {table.columns.map((column) => (
                              <th key={column.key} className="whitespace-nowrap px-3 py-2 font-medium">
                                {column.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row) => (
                            <tr
                              key={row.id}
                              className={`border-t border-[var(--line)] ${rowTone(row.tone)}`}
                            >
                              {table.columns.map((column) => (
                                <td key={column.key} className="whitespace-nowrap px-3 py-3">
                                  {row.cells[column.key] ?? '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function rowTone(tone?: Tone) {
  if (tone === 'rose') return 'bg-rose-50/70';
  if (tone === 'emerald') return 'bg-emerald-50/50';
  if (tone === 'teal') return 'bg-teal-50/60';
  if (tone === 'amber') return 'bg-amber-50/70';
  if (tone === 'sky') return 'bg-sky-50/70';
  return '';
}

function itemRows(
  rows: Item[],
  cells: (item: Item) => Record<string, ReactNode>,
  tone?: (item: Item) => Tone | undefined,
): TableModel['rows'] {
  return rows.map((item) => ({
    id: String(item.id),
    tone: tone?.(item),
    cells: cells(item),
  }));
}

function buildTables(detail: DashboardDetail, data: Dashboard, items: Item[], employees: Employee[]): TableModel[] {
  const rows = filterItems(detail, items);

  if (detail.kind === 'issued-not-working') {
    return [
      {
        empty: 'No issued items are currently not working.',
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'employee', header: 'Assigned employee' },
          { key: 'issue', header: 'Reported issue' },
          { key: 'date', header: 'Date reported' },
          { key: 'status', header: 'Repair status' },
        ],
        rows: itemRows(rows, (item) => ({
          code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
          name: itemLabel(item),
          employee: holderName(item),
          issue: item.notWorkingReason || '—',
          date: formatDay(item.handedDate || item.createdAt),
          status: <Badge tone="rose">Needs repair</Badge>,
        }), () => 'rose'),
      },
    ];
  }

  if (detail.kind === 'ready-to-issue') {
    return [
      {
        empty: 'No working units are sitting in stock.',
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'category', header: 'Category' },
          { key: 'location', header: 'Storage location' },
          { key: 'added', header: 'Date added to stock' },
        ],
        rows: itemRows(rows, (item) => ({
          code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
          name: itemLabel(item),
          category: item.componentName,
          location: <Badge tone="emerald">In stock</Badge>,
          added: formatDay(item.createdAt),
        }), () => 'emerald'),
      },
    ];
  }

  if (detail.kind === 'issued-to-staff') {
    return [
      {
        empty: 'No hardware is currently issued to staff.',
        columns: [
          { key: 'employee', header: 'Employee name' },
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'issued', header: 'Date issued' },
        ],
        rows: itemRows(rows, (item) => ({
          employee: holderName(item),
          code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
          name: itemLabel(item),
          issued: formatDay(item.originalIssuedDate || item.handedDate),
        }), () => 'teal'),
      },
    ];
  }

  if (detail.kind === 'failure-rate') {
    const categories = data.components.filter((component) => component.itemCount > 0);
    return [
      {
        heading: 'Failure rate by category',
        empty: 'No hardware categories recorded yet.',
        columns: [
          { key: 'name', header: 'Item name' },
          { key: 'total', header: 'Total fleet count' },
          { key: 'failures', header: 'Number of failures' },
          { key: 'rate', header: 'Failure rate' },
          { key: 'history', header: 'Maintenance history' },
        ],
        rows: categories.map((component) => {
          const failed = items.filter((item) => item.componentName === component.name && !isWorking(item));
          const history = failed
            .map((item) => item.notWorkingReason?.trim())
            .filter(Boolean)
            .slice(0, 3)
            .join('; ');
          return {
            id: `cat-${component.id}`,
            tone: component.notWorkingCount ? 'amber' : undefined,
            cells: {
              name: component.name,
              total: component.itemCount,
              failures: component.notWorkingCount,
              rate: `${pct(component.notWorkingCount, component.itemCount)}%`,
              history: history || (component.notWorkingCount ? 'No reason recorded' : 'No failures'),
            },
          };
        }),
      },
      {
        heading: 'Not working units',
        empty: 'Every unit in the fleet is currently working.',
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'holder', header: 'Current user' },
          { key: 'issue', header: 'Reported issue' },
          { key: 'status', header: 'Health status' },
        ],
        rows: itemRows(rows, (item) => ({
          code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
          name: itemLabel(item),
          holder: isIssued(item) ? holderName(item) : 'In stock',
          issue: item.notWorkingReason || '—',
          status: healthBadge(item),
        }), () => 'rose'),
      },
    ];
  }

  if (detail.kind === 'deployment-mix') {
    return [
      {
        empty: 'No items in this deployment slice yet.',
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'status', header: 'Deployment status' },
          { key: 'location', header: 'Location / assignee' },
        ],
        rows: itemRows(
          rows,
          (item) => ({
            code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
            name: itemLabel(item),
            status: deploymentBadge(item),
            location: isIssued(item) ? holderName(item) : 'In stock',
          }),
          (item) => (isIssued(item) ? 'teal' : 'amber'),
        ),
      },
    ];
  }

  if (detail.kind === 'fleet-health') {
    return [
      {
        empty: 'No items in this health slice yet.',
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'status', header: 'Health status' },
          { key: 'checked', header: 'Last recorded date' },
        ],
        rows: itemRows(
          rows,
          (item) => ({
            code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
            name: itemLabel(item),
            status: healthBadge(item),
            checked: formatDay(item.createdAt),
          }),
          (item) => (isWorking(item) ? 'emerald' : 'rose'),
        ),
      },
    ];
  }

  if (detail.kind === 'action-state') {
    return [
      {
        empty: 'No items in this action state yet.',
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'state', header: 'Action state' },
          { key: 'user', header: 'Current user' },
        ],
        rows: itemRows(
          rows,
          (item) => ({
            code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
            name: itemLabel(item),
            state: actionBadge(item),
            user: isIssued(item) ? holderName(item) : '—',
          }),
          (item) => {
            const state = actionState(item);
            if (state === 'Needs repair') return 'rose';
            if (state === 'Ready to issue') return 'sky';
            return 'teal';
          },
        ),
      },
    ];
  }

  if (detail.kind === 'coverage' && detail.ring === 'Staff covered') {
    const holders = data.holders;
    const uncovered = employeesWithoutHardware(employees, items);
    return [
      {
        heading: 'Employees with hardware',
        empty: 'No employees currently hold hardware.',
        columns: [
          { key: 'name', header: 'Employee' },
          { key: 'count', header: 'Items held' },
          { key: 'items', header: 'Hardware' },
        ],
        rows: holders.map((holder) => ({
          id: `emp-${holder.employeeId}`,
          tone: 'teal' as Tone,
          cells: {
            name: holder.fullName,
            count: holder.itemCount,
            items: itemsForEmployee(items, holder.employeeId, holder.fullName)
              .map((item) => item.uniqueCode)
              .join(', ') || '—',
          },
        })),
      },
      {
        heading: 'Employees without hardware',
        empty: 'Every employee currently holds at least one item.',
        columns: [
          { key: 'name', header: 'Employee' },
          { key: 'status', header: 'Coverage' },
        ],
        rows: uncovered.map((employee) => ({
          id: `open-${employee.id}`,
          cells: {
            name: employee.fullName,
            status: <Badge tone="stone">No hardware</Badge>,
          },
        })),
      },
    ];
  }

  if (detail.kind === 'category' || detail.kind === 'brand' || detail.kind === 'acquisition') {
    const empty =
      detail.kind === 'category'
        ? 'No items in this category yet.'
        : detail.kind === 'brand'
          ? 'No items for this brand yet.'
          : 'No items in this stock slice yet.';
    return [
      {
        empty,
        columns: [
          { key: 'code', header: 'Hardware ID' },
          { key: 'name', header: 'Item name' },
          { key: 'category', header: 'Category' },
          { key: 'brand', header: 'Brand' },
          { key: 'stock', header: 'Stock type' },
          { key: 'status', header: 'Deployment' },
          { key: 'health', header: 'Health' },
          { key: 'user', header: 'Current user' },
          { key: 'added', header: 'Date added' },
        ],
        rows: itemRows(
          rows,
          (item) => ({
            code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
            name: itemLabel(item),
            category: item.componentName,
            brand: item.brandName,
            stock: item.isNewAcquisition ? (
              <Badge tone="amber">New intake</Badge>
            ) : (
              <Badge tone="teal">Existing fleet</Badge>
            ),
            status: deploymentBadge(item),
            health: healthBadge(item),
            user: isIssued(item) ? holderName(item) : 'In stock',
            added: formatDay(item.createdAt),
          }),
          (item) => (isWorking(item) ? (isIssued(item) ? 'teal' : 'amber') : 'rose'),
        ),
      },
    ];
  }

  if (detail.kind === 'coverage' && detail.ring === 'Spare coverage') {
    const issuedCategories = data.components.filter((component) => component.issuedCount > 0);
    return [
      {
        empty: 'No issued categories to cover with a spare.',
        columns: [
          { key: 'name', header: 'Category' },
          { key: 'issued', header: 'Issued' },
          { key: 'spare', header: 'Working spares' },
          { key: 'status', header: 'Spare coverage' },
        ],
        rows: issuedCategories.map((component) => ({
          id: `spare-${component.id}`,
          tone: component.workingStockCount > 0 ? 'sky' : 'rose',
          cells: {
            name: component.name,
            issued: component.issuedCount,
            spare: component.workingStockCount,
            status:
              component.workingStockCount > 0 ? (
                <Badge tone="sky">Spare available</Badge>
              ) : (
                <Badge tone="rose">No working spare</Badge>
              ),
          },
        })),
      },
    ];
  }

  return [
    {
      empty: 'No fleet items to list yet.',
      columns: [
        { key: 'code', header: 'Hardware ID' },
        { key: 'type', header: 'Item type' },
        { key: 'user', header: 'Current user' },
        { key: 'health', header: 'Health status' },
        { key: 'spare', header: 'Spare available' },
      ],
      rows: itemRows(
        rows,
        (item) => ({
          code: <span className="font-medium text-[var(--brand)]">{item.uniqueCode}</span>,
          type: itemLabel(item),
          user: isIssued(item) ? holderName(item) : 'In stock',
          health: healthBadge(item),
          spare: hasSpareFor(item, data) ? (
            <Badge tone="sky">Yes</Badge>
          ) : (
            <Badge tone="rose">No</Badge>
          ),
        }),
        (item) => (isWorking(item) ? (isIssued(item) ? 'teal' : 'amber') : 'rose'),
      ),
    },
  ];
}
