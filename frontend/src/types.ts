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
  departmentId?: number | null;
  departmentName?: string | null;
}

export interface Department {
  id: number;
  name: string;
  createdAt: string;
  employeeCount: number;
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
  currentEmployeeDepartment?: string | null;
  originalEmployeeDepartment?: string | null;
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
  issuedItems: number;
  inStockItems: number;
  issuedNotWorkingItems: number;
  workingStockItems: number;
  employeeCount: number;
  employeesWithHardware: number;
  components: ComponentAnalytics[];
  holders: EmployeeLoad[];
  insights: string[];
  weeklyTrend: TrendPoint[];
  dailyPulse: DayPulse[];
  brandShares: BrandShare[];
  recentScans: ScanPulse[];
  activityPulse: ActivityPoint[];
}

export interface ComponentAnalytics {
  id: number;
  name: string;
  itemCount: number;
  issuedCount: number;
  inStockCount: number;
  workingStockCount: number;
  notWorkingCount: number;
  issuedNotWorkingCount: number;
}

export interface EmployeeLoad {
  employeeId: number;
  fullName: string;
  itemCount: number;
  departmentName?: string | null;
}

export interface TrendPoint {
  label: string;
  weekStart: string;
  added: number;
  issued: number;
  reissued: number;
}

export interface DayPulse {
  label: string;
  date: string;
  added: number;
  issued: number;
  reissued: number;
}

export interface BrandShare {
  id: number;
  name: string;
  componentName: string;
  itemCount: number;
  issuedCount: number;
  inStockCount: number;
  notWorkingCount: number;
}

export interface ScanPulse {
  id: number;
  title: string;
  startedAt: string;
  status: string;
  scannedCount: number;
  missingCount: number;
  workingCount: number;
  notWorkingCount: number;
}

export interface ActivityPoint {
  label: string;
  date: string;
  total: number;
  creates: number;
  updates: number;
  scans: number;
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
  expectedCount: number;
  newlyFoundCount: number;
}

export interface ScanItem {
  id: number;
  hardwareItemId: number;
  uniqueCode: string;
  componentName: string;
  brandName: string;
  componentId?: number | null;
  currentEmployeeId?: number | null;
  holderName?: string | null;
  holderDepartment?: string | null;
  issued: boolean;
  isPresent: boolean;
  isExpected: boolean;
  itemWasCreated: boolean;
  workingStatus: 'Working' | 'NotWorking';
  notWorkingReason?: string | null;
  scannedAt?: string | null;
  notes?: string | null;
  originalEmployeeName?: string | null;
  originalEmployeeDepartment?: string | null;
  originalIssuedDate?: string | null;
  handedDate?: string | null;
  scanId?: number | null;
  scanTitle?: string | null;
  scanStartedAt?: string | null;
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

export interface ScanLog {
  from: string;
  to: string;
  isToday: boolean;
  inSystemCount: number;
  scannedCount: number;
  missingCount: number;
  scannedItems: ScanItem[];
  missingItems: ScanItem[];
}

export interface ScanReportTotals {
  auditCount: number;
  inSystemEntered: number;
  scanned: number;
  misplaced: number;
  extraFound: number;
  uniqueMisplaced: number;
  uniqueScanned: number;
}

export interface ScanReportCategory {
  componentId?: number | null;
  name: string;
  uniqueExpected: number;
  uniqueScanned: number;
  uniqueMisplaced: number;
  missingOccurrences: number;
}

export interface ScanReportEmployee {
  employeeId?: number | null;
  name: string;
  uniqueAssigned: number;
  uniqueScanned: number;
  uniqueMisplaced: number;
  missingOccurrences: number;
}

export interface ScanReport {
  from: string;
  to: string;
  componentId?: number | null;
  employeeId?: number | null;
  completedScanCount: number;
  inProgressScanCount: number;
  totals: ScanReportTotals;
  scans: Scan[];
  categories: ScanReportCategory[];
  employees: ScanReportEmployee[];
  scannedItems: ScanItem[];
  missingItems: ScanItem[];
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
