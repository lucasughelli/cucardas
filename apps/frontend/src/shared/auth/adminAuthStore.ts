import { create } from "zustand";

const STORAGE_KEY = "cucardas.admin_session";

interface StoredAdminSession {
  token: string;
  email: string;
  role: "ADMIN" | "VIEWER";
}

interface AdminAuthState {
  token: string | null;
  email: string | null;
  role: "ADMIN" | "VIEWER" | null;
  setSession: (session: StoredAdminSession) => void;
  clearSession: () => void;
}

function readStoredSession(): StoredAdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAdminSession) : null;
  } catch {
    return null;
  }
}

const stored = readStoredSession();

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: stored?.token ?? null,
  email: stored?.email ?? null,
  role: stored?.role ?? null,
  setSession: (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    set({ token: session.token, email: session.email, role: session.role });
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, email: null, role: null });
  },
}));
