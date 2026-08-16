import api from './client';
import type {
  AuditLog,
  Brand,
  BrandDetail,
  Component,
  ComponentDetail,
  ConfirmScanResponse,
  Dashboard,
  Employee,
  Item,
  ParseBarcodeResponse,
  Scan,
  ScanDetail,
  ScanItem,
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
};

export const scansApi = {
  list: async () => {
    const { data } = await api.get<Scan[]>('/inventoryscans');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<ScanDetail>(`/inventoryscans/${id}`);
    return data;
  },
  create: async (payload: { title: string; notes?: string }) => {
    const { data } = await api.post<Scan>('/inventoryscans', payload);
    return data;
  },
  parseBarcode: async (scannedCode: string) => {
    const { data } = await api.post<ParseBarcodeResponse>('/inventoryscans/parse-barcode', {
      scannedCode,
    });
    return data;
  },
  confirmScan: async (
    id: number,
    payload: {
      brandId: number;
      sequenceNumber: number;
      isNewAcquisition: boolean;
      workingStatus: string;
      scannedCode?: string;
      notes?: string;
    },
  ) => {
    const { data } = await api.post<ConfirmScanResponse>(`/inventoryscans/${id}/scan-confirm`, payload);
    return data;
  },
  scan: async (
    id: number,
    payload: { uniqueCode: string; workingStatus: string; notes?: string },
  ) => {
    const { data } = await api.post<ScanItem>(`/inventoryscans/${id}/scan`, payload);
    return data;
  },
  updateItem: async (
    scanId: number,
    scanItemId: number,
    payload: { isPresent: boolean; workingStatus: string; notes?: string },
  ) => {
    await api.put(`/inventoryscans/${scanId}/items/${scanItemId}`, payload);
  },
  complete: async (id: number) => {
    const { data } = await api.post<ScanDetail>(`/inventoryscans/${id}/complete`);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/inventoryscans/${id}`);
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
  create: async (payload: { fullName: string }) => {
    const { data } = await api.post<Employee>('/employees', payload);
    return data;
  },
  update: async (id: number, payload: { fullName: string }) => {
    await api.put(`/employees/${id}`, payload);
  },
  remove: async (id: number) => {
    await api.delete(`/employees/${id}`);
  },
};
