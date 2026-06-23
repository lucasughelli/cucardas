import { apiClient } from "./client";

export interface Design {
  id: string;
  storeId: string;
  name: string;
  category?: string | null;
  canvasJson: Record<string, unknown>;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignVersion {
  id: string;
  designId: string;
  canvasJson: Record<string, unknown>;
  createdAt: string;
}

export async function listDesigns(params: { q?: string; category?: string } = {}): Promise<Design[]> {
  const { data } = await apiClient.get<{ designs: Design[] }>("/api/designs", { params });
  return data.designs;
}

export async function getDesign(id: string): Promise<Design> {
  const { data } = await apiClient.get<Design>(`/api/designs/${id}`);
  return data;
}

export interface SaveDesignInput {
  name: string;
  category?: string;
  canvasJson: Record<string, unknown>;
  thumbnailDataUrl?: string;
}

export async function createDesign(input: SaveDesignInput): Promise<Design> {
  const { data } = await apiClient.post<Design>("/api/designs", input);
  return data;
}

export async function updateDesign(id: string, input: Partial<SaveDesignInput>): Promise<Design> {
  const { data } = await apiClient.put<Design>(`/api/designs/${id}`, input);
  return data;
}

export async function deleteDesign(id: string): Promise<void> {
  await apiClient.delete(`/api/designs/${id}`);
}

export async function duplicateDesign(id: string, name?: string): Promise<Design> {
  const { data } = await apiClient.post<Design>(`/api/designs/${id}/duplicate`, { name });
  return data;
}

export async function listDesignVersions(id: string): Promise<DesignVersion[]> {
  const { data } = await apiClient.get<{ versions: DesignVersion[] }>(`/api/designs/${id}/versions`);
  return data.versions;
}

export async function restoreDesignVersion(designId: string, versionId: string): Promise<Design> {
  const { data } = await apiClient.post<Design>(`/api/designs/${designId}/versions/${versionId}/restore`);
  return data;
}

export async function uploadDesignAsset(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ url: string }>("/api/designs/assets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
