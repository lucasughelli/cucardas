import { apiClient } from "./client";

export type StoreUserRole = "ADMIN" | "EDITOR" | "VIEWER";

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: StoreUserRole;
  createdAt: string;
}

export async function listTeam(): Promise<{ users: TeamMember[]; currentTeamUserId: string | null }> {
  const { data } = await apiClient.get<{ users: TeamMember[]; currentTeamUserId: string | null }>("/api/team");
  return data;
}

export async function createTeamMember(input: {
  email: string;
  name?: string;
  password: string;
  role: StoreUserRole;
}): Promise<TeamMember> {
  const { data } = await apiClient.post<TeamMember>("/api/team", input);
  return data;
}

export async function deleteTeamMember(id: string): Promise<void> {
  await apiClient.delete(`/api/team/${id}`);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post("/api/team/change-password", { currentPassword, newPassword });
}

export interface TeamLoginResult {
  token: string;
  tnStoreId: string;
  user: TeamMember;
}

export async function teamLogin(email: string, password: string): Promise<TeamLoginResult> {
  const { data } = await apiClient.post<TeamLoginResult>("/auth/team/login", { email, password });
  return data;
}
