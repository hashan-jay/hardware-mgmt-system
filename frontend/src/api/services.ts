import api from './client';
import type {
  AuditLog,
  Brand,
  BrandDetail,
  Component,
  ComponentDetail,
  Dashboard,
  Department,
  Employee,
  Item,
  LabelPrinter,
  ParseBarcodeResponse,
  PrintSize,
  QueuedBarcode,
  ScanItem,
  ScanLog,
  User,
} from '../types';

export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    });
    return data;
  },
  me: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};

export const dashboardApi = {
  get: async () => {
    const { data } = await api.get<Dashboard>('/dashboard');
    return data;
  },
};

export const componentsApi = {
  list: async () => {
    const { data } = await api.get<Component[]>('/components');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<ComponentDetail>(`/components/${id}`);
    return data;
  },
  create: async (payload: { name: string; codePrefix?: string; description?: string }) => {
    const { data } = await api.post<Component>('/components', payload);
    return data;
  },
  update: async (id: number, payload: { name: string; codePrefix: string; description?: string }) => {
    await api.put(`/components/${id}`, payload);
  },
  remove: async (id: number) => {
    await api.delete(`/components/${id}`);
  },
};

export const brandsApi = {
  list: async (componentId: number) => {
    const { data } = await api.get<Brand[]>(`/components/${componentId}/brands`);
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<BrandDetail>(`/brands/${id}`);
    return data;
  },
  create: async (componentId: number, payload: { name: string; code?: string }) => {
    const { data } = await api.post<Brand>(`/components/${componentId}/brands`, payload);
    return data;
  },
  update: async (id: number, payload: { name: string; code: string }) => {
    await api.put(`/brands/${id}`, payload);
  },
  remove: async (id: number) => {
    await api.delete(`/brands/${id}`);
  },
};

export const itemsApi = {
  listAll: async () => {
    const { data } = await api.get<Item[]>('/items');
    return data;
  },
  list: async (brandId: number) => {
    const { data } = await api.get<Item[]>(`/brands/${brandId}/items`);
    return data;
  },
  create: async (
    brandId: number,
    payload: {
      uniqueCode: string;
      workingStatus?: string;
      notWorkingReason?: string;
      notes?: string;
    },
  ) => {
    const { data } = await api.post<Item>(`/brands/${brandId}/items`, payload);
    return data;
  },
  update: async (
    id: number,
    payload: {
      workingStatus: string;
      uniqueCode?: string;
      notWorkingReason?: string | null;
      notes?: string;
    },
  ) => {
    await api.put(`/items/${id}`, payload);
  },
  issue: async (id: number, payload: { employeeId: number; reason?: string }) => {
    await api.post(`/items/${id}/issue`, payload);
  },
  changePerson: async (id: number, payload: { employeeId: number; reason: string }) => {
    await api.post(`/items/${id}/change-person`, payload);
  },
  remove: async (id: number) => {
    await api.delete(`/items/${id}`);
  },
  byCode: async (code: string) => {
    const { data } = await api.get<Item>(`/items/by-code/${encodeURIComponent(code)}`);
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<Item>(`/items/${id}`);
    return data;
  },
};

export const scansApi = {
  log: async (from: string, to: string) => {
    const { data } = await api.get<ScanLog>('/inventoryscans/log', { params: { from, to } });
    return data;
  },
  record: async (payload: {
    uniqueCode: string;
    workingStatus: string;
    notes?: string;
    notWorkingReason?: string;
  }) => {
    const { data } = await api.post<ScanItem>('/inventoryscans/record', payload);
    return data;
  },
  parseBarcode: async (scannedCode: string) => {
    const { data } = await api.post<ParseBarcodeResponse>('/inventoryscans/parse-barcode', {
      scannedCode,
    });
    return data;
  },
};

export const auditApi = {
  list: async () => {
    const { data } = await api.get<AuditLog[]>('/auditlogs');
    return data;
  },
};

export const employeesApi = {
  list: async () => {
    const { data } = await api.get<Employee[]>('/employees');
    return data;
  },
  create: async (payload: { fullName: string; departmentId: number }) => {
    const { data } = await api.post<Employee>('/employees', payload);
    return data;
  },
  update: async (id: number, payload: { fullName: string; departmentId: number }) => {
    await api.put(`/employees/${id}`, payload);
  },
  remove: async (id: number) => {
    await api.delete(`/employees/${id}`);
  },
};

export const departmentsApi = {
  list: async () => {
    const { data } = await api.get<Department[]>('/departments');
    return data;
  },
  create: async (payload: { name: string }) => {
    const { data } = await api.post<Department>('/departments', payload);
    return data;
  },
};

export const printersApi = {
  list: async () => {
    const { data } = await api.get<LabelPrinter[]>('/printers');
    return data;
  },
  create: async (payload: { name: string }) => {
    const { data } = await api.post<LabelPrinter>('/printers', payload);
    return data;
  },
  select: async (id: number) => {
    await api.post(`/printers/${id}/select`);
  },
  remove: async (id: number) => {
    await api.delete(`/printers/${id}`);
  },
  listSizes: async (printerId: number) => {
    const { data } = await api.get<PrintSize[]>(`/printers/${printerId}/sizes`);
    return data;
  },
  createSize: async (
    printerId: number,
    payload: { name: string; widthMm: number; heightMm: number; isDefault?: boolean },
  ) => {
    const { data } = await api.post<PrintSize>(`/printers/${printerId}/sizes`, payload);
    return data;
  },
  setDefaultSize: async (sizeId: number) => {
    await api.post(`/printers/sizes/${sizeId}/default`);
  },
  removeSize: async (sizeId: number) => {
    await api.delete(`/printers/sizes/${sizeId}`);
  },
};

export const barcodeQueueApi = {
  list: async () => {
    const { data } = await api.get<QueuedBarcode[]>('/barcode-queue');
    return data;
  },
  queue: async (hardwareItemId: number) => {
    const { data } = await api.post<QueuedBarcode>('/barcode-queue', { hardwareItemId });
    return data;
  },
  assignSize: async (id: number, printSizeId: number) => {
    await api.put(`/barcode-queue/${id}/size`, { printSizeId });
  },
  remove: async (id: number) => {
    await api.delete(`/barcode-queue/${id}`);
  },
};
