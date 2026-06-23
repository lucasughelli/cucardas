import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuthStore } from "../shared/auth/adminAuthStore";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const token = useAdminAuthStore((state) => state.token);
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
