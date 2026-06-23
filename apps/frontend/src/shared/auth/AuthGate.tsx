import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "./authStore";

function consumeOAuthRedirectParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const storeId = params.get("store_id");
  if (!token || !storeId) return false;

  useAuthStore.getState().setSession({ token, tnStoreId: storeId });

  params.delete("token");
  params.delete("store_id");
  const newSearch = params.toString();
  const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
  window.history.replaceState({}, "", newUrl);
  return true;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    consumeOAuthRedirectParams();
  }, []);

  // Si la URL trae el token (recién volviendo del OAuth), ya está persistido sincrónicamente
  // por consumeOAuthRedirectParams antes del primer render relevante; igual lo chequeamos de nuevo
  // por si el efecto todavía no corrió en este render.
  const hasTokenInUrl = new URLSearchParams(window.location.search).has("token");

  if (!token && !hasTokenInUrl) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="card card--pad" style={{ textAlign: "center", maxWidth: 400 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              margin: "0 auto 18px",
              background: "linear-gradient(135deg, var(--brand), #8b5cf6)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 26,
            }}
          >
            ◆
          </div>
          <h1>Cucardas para Tiendanube</h1>
          <p style={{ color: "var(--text-2)", marginTop: 8 }}>
            Conectá tu tienda para empezar a crear y aplicar cucardas a tus productos.
          </p>
          <a
            className="btn btn--primary"
            style={{ marginTop: 18 }}
            href={`${import.meta.env.VITE_API_URL}/auth/tiendanube/install`}
          >
            Conectar con Tiendanube
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
