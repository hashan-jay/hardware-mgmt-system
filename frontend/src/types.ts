export type UserRole = 'Developer' | 'NetworkAdmin';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface Component {
  id: number;
  name: string;
  codePrefix: string;
  description?: string | null;
  brandCount: number;
  itemCount: number;
  createdAt: string;
}

export interface Brand {
  id: number;
  hardwareComponentId: number;
  name: string;
  code: string;
  itemCount: number;
  existingItemCount: number;
  newItemCount: number;
  createdAt: string;
}

export interface BrandDetail extends Brand {
  componentName: string;
  componentCodePrefix: string;
  items: Item[];
}

export interface ComponentDetail {
  id: number;
  name: string;
  codePrefix: string;
  description?: string | null;
  createdAt: string;
  brands: Brand[];
}

export interface Employee {
  id: number;
  fullName: string;
  createdAt: string;
}

export interface Item {
  id: number;
  brandId: number;
  uniqueCode: string;
  sequenceNumber: number;
  isNewAcquisition: boolean;
  workingStatus: 'Working' | 'NotWorking';
  notes?: string | null;
  componentName: string;
  brandName: string;
  createdAt: string;
  handedTo?: string | null;
  handedDate?: string | null;
  replacedItemCode?: string | null;
  replacedPerson?: string | null;
  replacedTo?: string | null;
  replacedDate?: string | null;
  originalEmployeeId?: number | null;
  originalEmployeeName?: string | null;
  currentEmployeeId?: number | null;
  currentEmployeeName?: string | null;
  notWorkingReason?: string | null;
  personChangeReason?: string | null;
  originalIssuedDate?: string | null;
}

export interface Dashboard {
  componentCount: number;
  brandCount: number;
  totalItems: number;
  workingItems: number;
  notWorkingItems: number;
  newAcquisitionItems: number;
  activeScanCount: number;
  components: Array<{
    id: number;
    name: string;
    codePrefix: string;
    brandCount: number;
    itemCount: number;
  }>;
}

export interface Scan {
  id: number;
  title: string;
  notes?: string | null;
  status: 'InProgress' | 'Completed';
  startedAt: string;
  completedAt?: string | null;
  createdBy: string;
  scannedCount: number;
  missingCount: number;
  workingCount: number;
  notWorkingCount: number;
}

export interface ScanItem {
  id: number;
  hardwareItemId: number;
  uniqueCode: string;
  componentName: string;
  brandName: string;
  isPresent: boolean;
  workingStatus: 'Working' | 'NotWorking';
  scannedAt: string;
  notes?: string | null;
  itemWasCreated?: boolean;
}

export interface ParseBarcodeResponse {
  scannedCode: string;
  sequenceNumber: number;
  isNewAcquisition: boolean;
  suggestedComponentPrefix?: string | null;
  suggestedBrandCode?: string | null;
  matchedComponentId?: number | null;
  matchedComponentName?: string | null;
  matchedBrandId?: number | null;
  matchedBrandName?: string | null;
  previewUniqueCode: string;
}

export interface ConfirmScanResponse {
  scanItem: ScanItem;
  item: Item;
  itemWasCreated: boolean;
  uniqueCode: string;
}

export interface MissingItem {
  hardwareItemId: number;
  uniqueCode: string;
  componentName: string;
  brandName: string;
  workingStatus: string;
}

export interface ScanDetail {
  id: number;
  title: string;
  notes?: string | null;
  status: 'InProgress' | 'Completed';
  startedAt: string;
  completedAt?: string | null;
  createdBy: string;
  scannedItems: ScanItem[];
  missingItems: MissingItem[];
}

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId?: number | null;
  details: string;
  createdAt: string;
}
