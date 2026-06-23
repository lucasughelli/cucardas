import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getErrorDetail } from "../../shared/api/admin";

export function ErrorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const errorQuery = useQuery({
    queryKey: ["admin-error", id],
    queryFn: () => getErrorDetail(id as string),
    enabled: Boolean(id),
  });

  if (errorQuery.isLoading) return <p>Cargando...</p>;
  if (!errorQuery.data) return <p>Error no encontrado.</p>;

  const error = errorQuery.data;

  return (
    <div className="page">
      <Link to="/admin/errors" style={{ fontSize: 13 }}>
        ← Volver al monitor de errores
      </Link>
      <h1>{error.message}</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <table className="data-table">
          <tbody>
            <tr>
              <th>Fecha</th>
              <td>{new Date(error.createdAt).toLocaleString("es-AR")}</td>
            </tr>
            <tr>
              <th>Severidad</th>
              <td>{error.level}</td>
            </tr>
            <tr>
              <th>Origen</th>
              <td>{error.source}</td>
            </tr>
            <tr>
              <th>Tienda</th>
              <td>{error.store?.name ?? error.store?.tnStoreId ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {error.stack && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Stack trace</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: 0, overflowX: "auto" }}>{error.stack}</pre>
        </div>
      )}

      {error.context && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Contexto</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: 0, overflowX: "auto" }}>
            {JSON.stringify(error.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
