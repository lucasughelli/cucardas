import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  forceResync,
  getStore,
  reactivateStore,
  resetStoreToken,
  suspendStore,
} from "../../shared/api/admin";

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [reconnectUrl, setReconnectUrl] = useState<string | null>(null);

  const storeQuery = useQuery({
    queryKey: ["admin-store", id],
    queryFn: () => getStore(id as string),
    enabled: Boolean(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-store", id] });
  const suspendMutation = useMutation({ mutationFn: () => suspendStore(id as string), onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: () => reactivateStore(id as string), onSuccess: invalidate });
  const resyncMutation = useMutation({ mutationFn: () => forceResync(id as string), onSuccess: invalidate });
  const resetTokenMutation = useMutation({
    mutationFn: () => resetStoreToken(id as string),
    onSuccess: (data) => {
      setReconnectUrl(data.reconnectUrl);
      invalidate();
    },
  });

  if (storeQuery.isLoading) return <p>Cargando...</p>;
  if (!storeQuery.data) return <p>Tienda no encontrada.</p>;

  const store = storeQuery.data;

  return (
    <div className="page">
      <Link to="/admin/clients" style={{ fontSize: 13 }}>
        ← Volver a clientes
      </Link>
      <h1 style={{ margin: "10px 0 20px" }}>{store.name ?? `Tienda #${store.tnStoreId}`}</h1>

      <div className="card card--pad" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <tbody>
            <tr>
              <th>ID Tiendanube</th>
              <td>{store.tnStoreId}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{store.email ?? "—"}</td>
            </tr>
            <tr>
              <th>Estado</th>
              <td>
                <span className={`badge ${store.status === "ACTIVE" ? "active" : "suspended"}`}>
                  {store.status === "ACTIVE" ? "Activa" : "Suspendida"}
                </span>
              </td>
            </tr>
            <tr>
              <th>Instalada</th>
              <td>{formatDate(store.installedAt)}</td>
            </tr>
            <tr>
              <th>Última sincronización</th>
              <td>{formatDate(store.lastSyncAt)}</td>
            </tr>
            <tr>
              <th>Script tag</th>
              <td>{store.scriptTagId ? `Registrado (#${store.scriptTagId})` : "No registrado"}</td>
            </tr>
            <tr>
              <th>Diseños</th>
              <td>{store._count.designs}</td>
            </tr>
            <tr>
              <th>Cucardas aplicadas</th>
              <td>{store._count.assignments}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn--ghost" onClick={() => resyncMutation.mutate()} disabled={resyncMutation.isPending}>
          Forzar resincronización
        </button>
        {store.status === "ACTIVE" ? (
          <button className="btn btn--danger" onClick={() => suspendMutation.mutate()} disabled={suspendMutation.isPending}>
            Suspender cuenta
          </button>
        ) : (
          <button className="btn btn--ghost" onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}>
            Reactivar cuenta
          </button>
        )}
        <button className="btn btn--ghost" onClick={() => resetTokenMutation.mutate()} disabled={resetTokenMutation.isPending}>
          Resetear token
        </button>
      </div>

      {reconnectUrl && (
        <div className="card card--pad" style={{ marginTop: 16 }}>
          <p style={{ margin: 0, fontSize: 13 }}>
            Tiendanube no permite renovar el token sin que el merchant vuelva a autorizar la app. Se suspendió la
            cuenta; compartile este link para que reconecte:
          </p>
          <code style={{ display: "block", marginTop: 8, fontSize: 12, wordBreak: "break-all" }}>{reconnectUrl}</code>
        </div>
      )}
    </div>
  );
}
