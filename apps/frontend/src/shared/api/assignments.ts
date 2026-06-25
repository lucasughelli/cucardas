import { apiClient } from "./client";
import type { CucardaType } from "../cucardas/types";

export interface Assignment {
  id: string;
  storeId: string;
  designId: string;
  productId: string;
  active: boolean;
  createdAt: string;
  design: {
    id: string;
    name: string;
    type: CucardaType;
    text: string | null;
    textColor: string | null;
    backgroundColor: string | null;
    thumbnailUrl: string | null;
  };
}

export async function listAssignments(productId?: string): Promise<Assignment[]> {
  const { data } = await apiClient.get<{ assignments: Assignment[] }>("/api/assignments", {
    params: productId ? { productId } : undefined,
  });
  return data.assignments;
}

export async function createAssignments(input: { designId: string; productIds: string[] }): Promise<Assignment[]> {
  const { data } = await apiClient.post<{ assignments: Assignment[] }>("/api/assignments", input);
  return data.assignments;
}

export async function setAssignmentActive(id: string, active: boolean): Promise<Assignment> {
  const { data } = await apiClient.patch<Assignment>(`/api/assignments/${id}`, { active });
  return data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete(`/api/assignments/${id}`);
}

/** Quita todas las cucardas de los productos indicados (acción masiva). */
export async function bulkRemoveAssignments(productIds: string[]): Promise<number> {
  const { data } = await apiClient.post<{ removed: number }>("/api/assignments/bulk-remove", { productIds });
  return data.removed;
}
