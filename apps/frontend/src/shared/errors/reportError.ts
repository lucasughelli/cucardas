import { apiClient } from "../api/client";
import { useAuthStore } from "../auth/authStore";

export function reportError(message: string, stack?: string, context?: Record<string, unknown>) {
  // Solo se puede reportar si ya hay una sesión de tienda (el endpoint requiere auth).
  if (!useAuthStore.getState().token) return;

  apiClient.post("/api/errors/report", { message, stack, context }).catch(() => {
    // Si falla el reporte de error no hay nada más que hacer; no debe romper la UI.
  });
}

export function installGlobalErrorReporting() {
  window.addEventListener("error", (event) => {
    reportError(event.message, event.error?.stack);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportError(
      reason instanceof Error ? reason.message : String(reason),
      reason instanceof Error ? reason.stack : undefined,
    );
  });
}
