import { adminApiClient } from "./adminClient";

export interface AdminStore {
  id: string;
  tnStoreId: string;
  name: string | null;
  email: string | null;
  status: "ACTIVE" | "SUSPENDED";
  scriptTagId: string | null;
  installedAt: string;
  lastSyncAt: string | null;
  uninstalledAt: string | null;
  _count: { designs: number; assignments: number; errorLogs?: number };
}

export async function listStores(params: { q?: string; status?: string }): Promise<AdminStore[]> {
  const { data } = await adminApiClient.get<{ stores: AdminStore[] }>("/stores", { params });
  return data.stores;
}

export async function getStore(id: string): Promise<AdminStore> {
  const { data } = await adminApiClient.get<AdminStore>(`/stores/${id}`);
  return data;
}

export async function suspendStore(id: string): Promise<AdminStore> {
  const { data } = await adminApiClient.post<AdminStore>(`/stores/${id}/suspend`);
  return data;
}

export async function reactivateStore(id: string): Promise<AdminStore> {
  const { data } = await adminApiClient.post<AdminStore>(`/stores/${id}/reactivate`);
  return data;
}

export async function resetStoreToken(id: string): Promise<{ store: AdminStore; reconnectUrl: string }> {
  const { data } = await adminApiClient.post(`/stores/${id}/reset-token`);
  return data;
}

export async function forceResync(id: string): Promise<AdminStore> {
  const { data } = await adminApiClient.post<AdminStore>(`/stores/${id}/resync`);
  return data;
}

export interface AdminErrorLog {
  id: string;
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  source: "FRONTEND" | "BACKEND" | "API";
  message: string;
  stack: string | null;
  context: Record<string, unknown> | null;
  createdAt: string;
  storeId: string | null;
  store?: { name: string | null; tnStoreId: string } | null;
}

export interface ErrorsFilter {
  q?: string;
  level?: string;
  source?: string;
  storeId?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export async function listErrors(filter: ErrorsFilter): Promise<{ items: AdminErrorLog[]; total: number; page: number; perPage: number }> {
  const { data } = await adminApiClient.get("/errors", { params: filter });
  return data;
}

export async function getErrorDetail(id: string): Promise<AdminErrorLog> {
  const { data } = await adminApiClient.get<AdminErrorLog>(`/errors/${id}`);
  return data;
}

export async function exportErrorsCsv(filter: ErrorsFilter): Promise<Blob> {
  const { data } = await adminApiClient.get("/errors/export", { params: filter, responseType: "blob" });
  return data;
}

export interface ErrorGroup {
  message: string;
  level: string;
  source: string;
  count: number;
  lastSeen: string;
}

export async function getGroupedErrors(): Promise<ErrorGroup[]> {
  const { data } = await adminApiClient.get<{ groups: ErrorGroup[] }>("/errors/grouped");
  return data.groups;
}

export interface AnalyticsOverview {
  designsByDay: { day: string; count: number }[];
  errorsByDay: { day: string; count: number }[];
  activeStores: number;
  suspendedStores: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const { data } = await adminApiClient.get<AnalyticsOverview>("/analytics/overview");
  return data;
}
