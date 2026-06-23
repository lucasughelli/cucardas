import { create } from "zustand";

const STORAGE_KEY = "cucardas.session";

interface StoredSession {
  token: string;
  tnStoreId: string;
}

interface AuthState {
  token: string | null;
  tnStoreId: string | null;
  setSession: (session: StoredSession) => void;
  clearSession: () => void;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

const stored = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: stored?.token ?? null,
  tnStoreId: stored?.tnStoreId ?? null,
  setSession: (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    set({ token: session.token, tnStoreId: session.tnStoreId });
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, tnStoreId: null });
  },
}));
