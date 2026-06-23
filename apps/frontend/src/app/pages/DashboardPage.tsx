import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { describeAction, getDashboardSummary } from "../../shared/api/dashboard";
import { CucardaBadge } from "../../shared/cucardas/CucardaBadge";
import { IconBox, IconChart, IconTag } from "../../shared/components/icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Dashboard</h1>
          <div className="page__title-sub">Resumen de tus cucardas y actividad reciente.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="stat">
          <div className="stat__label">
            <span className="stat__icon">
              <IconTag style={{ width: 18, height: 18 }} />
            </span>
            Cucardas activas
          </div>
          <div className="stat__value">{isLoading ? "—" : data?.activeCucardasCount}</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <span className="stat__icon">
              <IconBox style={{ width: 18, height: 18 }} />
            </span>
            Productos con cucardas
          </div>
          <div className="stat__value">{isLoading ? "—" : data?.productsWithCucardasCount}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div className="card card--pad">
          <h3 style={{ marginBottom: 14 }}>Cucardas recientes</h3>
          {data?.recentDesigns.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Todavía no creaste cucardas.</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {data?.recentDesigns.map((cucarda) => (
              <button
                key={cucarda.id}
                onClick={() => navigate("/cucardas")}
                className="btn btn--ghost"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96, gap: 6, height: "auto", padding: 10 }}
              >
                <div style={{ width: 70, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CucardaBadge cucarda={cucarda} />
                </div>
                <span style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 86 }}>
                  {cucarda.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card card--pad">
          <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <IconChart style={{ width: 16, height: 16, color: "var(--text-3)" }} /> Cambios recientes
          </h3>
          {data?.recentActivity.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Sin actividad todavía.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data?.recentActivity.map((entry) => (
              <div key={entry.id} style={{ fontSize: 13, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                <strong>{describeAction(entry.action)}</strong>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{formatDate(entry.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
