import { apiClient } from "./client";
import type { Cucarda, CucardaFormValues } from "../cucardas/types";

export interface ListCucardasParams {
  q?: string;
  type?: string;
  active?: boolean;
}

export async function listCucardas(params: ListCucardasParams = {}): Promise<Cucarda[]> {
  const { data } = await apiClient.get<{ designs: Cucarda[] }>("/api/designs", { params });
  return data.designs;
}

export async function getCucarda(id: string): Promise<Cucarda> {
  const { data } = await apiClient.get<Cucarda>(`/api/designs/${id}`);
  return data;
}

export async function createCucarda(input: CucardaFormValues): Promise<Cucarda> {
  const { data } = await apiClient.post<Cucarda>("/api/designs", input);
  return data;
}

export async function updateCucarda(id: string, input: Partial<CucardaFormValues>): Promise<Cucarda> {
  const { data } = await apiClient.put<Cucarda>(`/api/designs/${id}`, input);
  return data;
}

export async function setCucardaActive(id: string, active: boolean): Promise<Cucarda> {
  const { data } = await apiClient.patch<Cucarda>(`/api/designs/${id}/active`, { active });
  return data;
}

export async function deleteCucarda(id: string): Promise<void> {
  await apiClient.delete(`/api/designs/${id}`);
}

export async function duplicateCucarda(id: string, name?: string): Promise<Cucarda> {
  const { data } = await apiClient.post<Cucarda>(`/api/designs/${id}/duplicate`, { name });
  return data;
}
