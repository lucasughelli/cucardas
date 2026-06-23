import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forceResync, listStores, reactivateStore, suspendStore } from "../../shared/api/admin";

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export function ClientsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: ["admin-stores", q, status],
    queryFn: () => listStores({ q: q || undefined, status: status || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
  const suspendMutation = useMutation({ mutationFn: suspendStore, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: reactivateStore, onSuccess: invalidate });
  const resyncMutation = useMutation({ mutationFn: forceResync, onSuccess: invalidate });

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Clientes</h1>
          <div className="page__title-sub">Tiendas que instalaron la app.</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          className="input"
          placeholder="Buscar por nombre, email o ID de tienda..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="SUSPENDED">Suspendidos</option>
        </select>
      </div>

      {storesQuery.isLoading && <p>Cargando...</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Tienda</th>
            <th>Estado</th>
            <th>Diseños</th>
            <th>Cucardas</th>
            <th>Instalada</th>
            <th>Última sync</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {storesQuery.data?.map((store) => (
            <tr key={store.id}>
              <td>
                <Link to={`/admin/clients/${store.id}`}>{store.name ?? `Tienda #${store.tnStoreId}`}</Link>
                <div style={{ fontSize: 12, color: "#9fb0bb" }}>{store.email}</div>
              </td>
              <td>
                <span className={`badge ${store.status === "ACTIVE" ? "active" : "suspended"}`}>
                  {store.status === "ACTIVE" ? "Activa" : "Suspendida"}
                </span>
              </td>
              <td>{store._count.designs}</td>
              <td>{store._count.assignments}</td>
              <td>{formatDate(store.installedAt)}</td>
              <td>{formatDate(store.lastSyncAt)}</td>
              <td>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn secondary" onClick={() => resyncMutation.mutate(store.id)}>
                    Resincronizar
                  </button>
                  {store.status === "ACTIVE" ? (
                    <button className="btn danger" onClick={() => suspendMutation.mutate(store.id)}>
                      Suspender
                    </button>
                  ) : (
                    <button className="btn secondary" onClick={() => reactivateMutation.mutate(store.id)}>
                      Reactivar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
