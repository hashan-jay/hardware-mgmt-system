import type { Dashboard, Employee, Item } from '../../types';
import { pct } from './palette';

export type KpiDetailId = 'issued-not-working' | 'ready-to-issue' | 'issued-to-staff' | 'failure-rate';
export type PieDetailId = 'deployment-mix' | 'fleet-health' | 'action-state';
export type CoverageRing = 'Staff covered' | 'Issued share' | 'Fleet working' | 'Spare coverage';

export type DashboardDetail =
  | { kind: KpiDetailId }
  | { kind: PieDetailId; slice?: string }
  | { kind: 'coverage'; ring?: CoverageRing }
  | { kind: 'category'; slice?: string }
  | { kind: 'brand'; slice?: string; brandId?: number }
  | { kind: 'acquisition'; slice?: string };

export function isIssued(item: Item) {
  return Boolean(item.currentEmployeeId || item.handedTo?.trim());
}

export function isWorking(item: Item) {
  return item.workingStatus === 'Working';
}

export function holderName(item: Item) {
  return item.currentEmployeeName || item.handedTo || '—';
}

export function itemLabel(item: Item) {
  return item.brandName ? `${item.componentName} · ${item.brandName}` : item.componentName;
}

export function formatDay(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function actionState(item: Item) {
  if (!isWorking(item)) return 'Needs repair';
  if (isIssued(item)) return 'Issued and working';
  return 'Ready to issue';
}

export function deploymentStatus(item: Item) {
  return isIssued(item) ? 'Issued' : 'In stock';
}

export function hasSpareFor(item: Item, data: Dashboard) {
  const component = data.components.find((entry) => entry.name === item.componentName);
  return Boolean(component && component.workingStockCount > 0);
}

export function filterItems(detail: DashboardDetail, items: Item[]) {
  switch (detail.kind) {
    case 'issued-not-working':
      return items.filter((item) => isIssued(item) && !isWorking(item));
    case 'ready-to-issue':
      return items.filter((item) => !isIssued(item) && isWorking(item));
    case 'issued-to-staff':
      return items.filter(isIssued);
    case 'failure-rate':
      return items.filter((item) => !isWorking(item));
    case 'deployment-mix':
      if (detail.slice === 'Issued') return items.filter(isIssued);
      if (detail.slice === 'In stock') return items.filter((item) => !isIssued(item));
      return items;
    case 'fleet-health':
      if (detail.slice === 'Working') return items.filter(isWorking);
      if (detail.slice === 'Not working') return items.filter((item) => !isWorking(item));
      return items;
    case 'action-state':
      if (detail.slice === 'Ready to issue') return items.filter((item) => !isIssued(item) && isWorking(item));
      if (detail.slice === 'Issued and working') return items.filter((item) => isIssued(item) && isWorking(item));
      if (detail.slice === 'Needs repair') return items.filter((item) => !isWorking(item));
      return items;
    case 'coverage':
      if (detail.ring === 'Issued share') return items.filter(isIssued);
      if (detail.ring === 'Fleet working') return items.filter(isWorking);
      return items;
    case 'category':
      if (detail.slice) return items.filter((item) => item.componentName === detail.slice);
      return items;
    case 'brand':
      if (detail.brandId) return items.filter((item) => item.brandId === detail.brandId);
      if (detail.slice) return items.filter((item) => item.brandName === detail.slice);
      return items;
    case 'acquisition':
      if (detail.slice === 'New intake') return items.filter((item) => item.isNewAcquisition);
      if (detail.slice === 'Existing fleet') return items.filter((item) => !item.isNewAcquisition);
      return items;
    default:
      return items;
  }
}

export function detailCopy(detail: DashboardDetail, data: Dashboard) {
  const slice = 'slice' in detail ? detail.slice : undefined;
  const ring = detail.kind === 'coverage' ? detail.ring : undefined;

  const titles: Record<DashboardDetail['kind'], string> = {
    'issued-not-working': 'Issued not working',
    'ready-to-issue': 'Ready to issue',
    'issued-to-staff': 'Issued to staff',
    'failure-rate': 'Failure rate',
    'deployment-mix': slice ? `Deployment mix · ${slice}` : 'Deployment mix',
    'fleet-health': slice ? `Fleet health · ${slice}` : 'Fleet health',
    'action-state': slice ? `Action state · ${slice}` : 'Action state',
    coverage: ring ? `Coverage · ${ring}` : 'Coverage rings',
    category: slice ? `Items by category · ${slice}` : 'Items by category',
    brand: slice ? `Items by brand · ${slice}` : 'Items by brand',
    acquisition: slice ? `New vs existing stock · ${slice}` : 'New vs existing stock',
  };

  const captions: Record<DashboardDetail['kind'], string> = {
    'issued-not-working': 'Staff blocked until these units are repaired or replaced.',
    'ready-to-issue': 'Working units still in stock and available to issue today.',
    'issued-to-staff': `${data.employeesWithHardware}/${data.employeeCount || 0} employees currently hold hardware.`,
    'failure-rate': `${data.notWorkingItems} not working of ${data.totalItems} total · ${pct(data.notWorkingItems, data.totalItems)}% failure rate.`,
    'deployment-mix': slice
      ? `Items currently marked as ${slice.toLowerCase()}.`
      : `${data.issuedItems} issued · ${data.inStockItems} in stock.`,
    'fleet-health': slice
      ? `Items currently marked as ${slice.toLowerCase()}.`
      : `${data.workingItems} working · ${data.notWorkingItems} not working.`,
    'action-state': slice
      ? `Items in the ${slice.toLowerCase()} bucket.`
      : `${data.workingStockItems} ready to issue, plus issued working units and anything that needs repair.`,
    coverage: ring
      ? coverageCaption(ring, data)
      : 'Live fleet: who has hardware, how much is out, health, and whether issued categories still have a working spare.',
    category: slice
      ? `Every live unit in ${slice}.`
      : 'Share of the live inventory by hardware component.',
    brand: slice
      ? `Every live unit under ${slice}.`
      : 'Where units sit by brand across the live fleet.',
    acquisition: slice
      ? `Items classified as ${slice.toLowerCase()}.`
      : `${data.newAcquisitionItems} new intake · ${Math.max(0, data.totalItems - data.newAcquisitionItems)} already on the books.`,
  };

  return { title: titles[detail.kind], caption: captions[detail.kind] };
}

function coverageCaption(ring: CoverageRing, data: Dashboard) {
  const issuedCategories = data.components.filter((component) => component.issuedCount > 0);
  const withSpare = issuedCategories.filter((component) => component.workingStockCount > 0);

  if (ring === 'Staff covered') {
    return `${data.employeesWithHardware}/${data.employeeCount || 0} employees currently hold at least one item.`;
  }
  if (ring === 'Issued share') {
    return `${data.issuedItems} of ${data.totalItems} items are currently with staff.`;
  }
  if (ring === 'Fleet working') {
    return `${data.workingItems} working units across the live fleet.`;
  }
  return issuedCategories.length
    ? `${withSpare.length}/${issuedCategories.length} issued categories still have a working spare.`
    : 'No issued categories yet.';
}

export function employeesWithoutHardware(employees: Employee[], items: Item[]) {
  const holding = new Set(
    items.filter(isIssued).map((item) => item.currentEmployeeId).filter((id): id is number => id != null),
  );
  return employees.filter((employee) => !holding.has(employee.id));
}

export function itemsForEmployee(items: Item[], employeeId: number, fullName: string) {
  return items.filter(
    (item) => item.currentEmployeeId === employeeId || item.currentEmployeeName === fullName || item.handedTo === fullName,
  );
}
