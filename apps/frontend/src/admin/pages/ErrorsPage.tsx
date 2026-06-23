import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { exportErrorsCsv, getGroupedErrors, listErrors, type ErrorsFilter } from "../../shared/api/admin";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ErrorsPage() {
  const [view, setView] = useState<"list" | "grouped">("list");
  const [filter, setFilter] = useState<ErrorsFilter>({ page: 1, perPage: 25 });
  const [exporting, setExporting] = useState(false);

  const errorsQuery = useQuery({
    queryKey: ["admin-errors", filter],
    queryFn: () => listErrors(filter),
    enabled: view === "list",
  });

  const groupedQuery = useQuery({
    queryKey: ["admin-errors-grouped"],
    queryFn: getGroupedErrors,
    enabled: view === "grouped",
  });

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportErrorsCsv(filter);
      downloadBlob(blob, "errores.csv");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Monitor de errores</h1>
        <button className="btn secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? "Exportando..." : "Exportar CSV"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`btn secondary${view === "list" ? " active" : ""}`} onClick={() => setView("list")}>
          Lista
        </button>
        <button className={`btn secondary${view === "grouped" ? " active" : ""}`} onClick={() => setView("grouped")}>
          Agrupados por patrón
        </button>
      </div>

      {view === "list" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Buscar en el mensaje..."
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value || undefined, page: 1 }))}
              style={{ flex: 1, minWidth: 200 }}
            />
            <select
              className="select"
              onChange={(e) => setFilter((f) => ({ ...f, level: e.target.value || undefined, page: 1 }))}
            >
              <option value="">Severidad</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select
              className="select"
              onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value || undefined, page: 1 }))}
            >
              <option value="">Origen</option>
              <option value="FRONTEND">Frontend</option>
              <option value="BACKEND">Backend</option>
              <option value="API">API Tiendanube</option>
            </select>
            <input
              className="input"
              type="date"
              onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))}
            />
            <input
              className="input"
              type="date"
              onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value || undefined, page: 1 }))}
            />
          </div>

          {errorsQuery.isLoading && <p>Cargando...</p>}

          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Severidad</th>
                <th>Origen</th>
                <th>Tienda</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {errorsQuery.data?.items.map((error) => (
                <tr key={error.id}>
                  <td>{formatDate(error.createdAt)}</td>
                  <td>{error.level}</td>
                  <td>{error.source}</td>
                  <td>{error.store?.name ?? error.store?.tnStoreId ?? "—"}</td>
                  <td>
                    <Link to={`/admin/errors/${error.id}`}>{error.message.slice(0, 100)}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {errorsQuery.data && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn secondary"
                disabled={(filter.page ?? 1) <= 1}
                onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Anterior
              </button>
              <span style={{ alignSelf: "center", fontSize: 13 }}>
                Página {errorsQuery.data.page} · {errorsQuery.data.total} resultados
              </span>
              <button
                className="btn secondary"
                disabled={(filter.page ?? 1) * (filter.perPage ?? 25) >= errorsQuery.data.total}
                onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {view === "grouped" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mensaje</th>
              <th>Severidad</th>
              <th>Origen</th>
              <th>Ocurrencias</th>
              <th>Última vez</th>
            </tr>
          </thead>
          <tbody>
            {groupedQuery.data?.map((group, idx) => (
              <tr key={idx}>
                <td>{group.message.slice(0, 100)}</td>
                <td>{group.level}</td>
                <td>{group.source}</td>
                <td>{group.count}</td>
                <td>{formatDate(group.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
