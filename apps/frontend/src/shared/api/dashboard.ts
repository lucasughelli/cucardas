import { apiClient } from "./client";
import type { Cucarda } from "../cucardas/types";

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardSummary {
  activeCucardasCount: number;
  productsWithCucardasCount: number;
  recentActivity: AuditLogEntry[];
  recentDesigns: Cucarda[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/api/dashboard/summary");
  return data;
}

const ACTION_LABELS: Record<string, string> = {
  "assignment.created": "Cucarda aplicada",
  "assignment.activated": "Cucarda activada",
  "assignment.deactivated": "Cucarda desactivada",
  "assignment.deleted": "Cucarda quitada",
};

export function describeAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
