import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  deleteCucarda,
  duplicateCucarda,
  listCucardas,
  setCucardaActive,
} from "../../shared/api/cucardas";
import { CucardaBadge } from "../../shared/cucardas/CucardaBadge";
import { LOCATION_LABELS, TYPE_LABELS } from "../../shared/cucardas/labels";
import type { Cucarda } from "../../shared/cucardas/types";
import {
  IconBox,
  IconChart,
  IconCopy,
  IconEdit,
  IconPlus,
  IconPower,
  IconSearch,
  IconTag,
  IconTrash,
} from "../../shared/components/icons";
import { CucardaModal } from "../cucardas/CucardaModal";

/** Estado de una cucarda considerando activación manual + ventana de programación. */
function scheduleStatus(c: Cucarda): { label: string; cls: string } {
  if (!c.active) return { label: "Inactiva", cls: "pill--muted" };
  const now = Date.now();
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: "Programada", cls: "pill--brand" };
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return { label: "Finalizada", cls: "pill--muted" };
  return { label: "Activa", cls: "pill--success" };
}

export function CucardasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cucarda | undefined>(undefined);

  // Traemos todas y filtramos en cliente: el dataset por tienda es chico y así los KPIs son estables.
  const cucardasQuery = useQuery({ queryKey: ["cucardas"], queryFn: () => listCucardas({}) });
  const all = useMemo(() => cucardasQuery.data ?? [], [cucardasQuery.data]);

  const categories = useMemo(
    () => Array.from(new Set(all.map((c) => c.category).filter(Boolean))) as string[],
    [all],
  );

  const stats = useMemo(() => {
    const active = all.filter((c) => c.active).length;
    const assignments = all.reduce((sum, c) => sum + (c._count?.assignments ?? 0), 0);
    return { total: all.length, active, assignments, categories: categories.length };
  }, [all, categories.length]);

  const cucardas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.text ?? "").toLowerCase().includes(q)) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "inactive" && c.active) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      return true;
    });
  }, [all, search, typeFilter, statusFilter, categoryFilter]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cucardas"] });
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setCucardaActive(id, active),
    onSuccess: invalidate,
  });
  const duplicateMutation = useMutation({ mutationFn: (id: string) => duplicateCucarda(id), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteCucarda, onSuccess: invalidate });

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(c: Cucarda) {
    setEditing(c);
    setModalOpen(true);
  }

  const hasFilters = Boolean(search || typeFilter || statusFilter || categoryFilter);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Cucardas</h1>
          <div className="page__title-sub">Creá stickers y aplicálos a los productos de tu tienda.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          <IconPlus /> Nueva cucarda
        </button>
      </div>

      {/* ---- KPIs ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div className="stat">
          <div className="stat__label"><span className="stat__icon"><IconTag style={{ width: 18, height: 18 }} /></span>Total</div>
          <div className="stat__value">{cucardasQuery.isLoading ? "—" : stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat__label"><span className="stat__icon"><IconPower style={{ width: 18, height: 18 }} /></span>Activas</div>
          <div className="stat__value">{cucardasQuery.isLoading ? "—" : stats.active}</div>
        </div>
        <div className="stat">
          <div className="stat__label"><span className="stat__icon"><IconBox style={{ width: 18, height: 18 }} /></span>Asociaciones</div>
          <div className="stat__value">{cucardasQuery.isLoading ? "—" : stats.assignments}</div>
        </div>
        <div className="stat">
          <div className="stat__label"><span className="stat__icon"><IconChart style={{ width: 18, height: 18 }} /></span>Categorías</div>
          <div className="stat__value">{cucardasQuery.isLoading ? "—" : stats.categories}</div>
        </div>
      </div>

      {/* ---- Filtros ---- */}
      <div className="row" style={{ marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 360 }}>
          <IconSearch style={{ position: "absolute", left: 11, top: 9, width: 16, height: 16, color: "var(--text-3)" }} />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por nombre o texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select" style={{ width: 150 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="TEXT">Texto</option>
          <option value="IMAGE">Imagen</option>
        </select>
        <select className="select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        {categories.length > 0 && (
          <select className="select" style={{ width: 170 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setSearch(""); setTypeFilter(""); setStatusFilter(""); setCategoryFilter("");
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {cucardasQuery.isLoading ? (
        <div className="empty">Cargando cucardas...</div>
      ) : all.length === 0 ? (
        <div className="table-wrap">
          <div className="empty">
            <div className="empty__icon">
              <IconTag style={{ width: 40, height: 40, color: "var(--text-3)" }} />
            </div>
            <h3>Todavía no tenés cucardas</h3>
            <p style={{ marginTop: 6 }}>Creá la primera desde una plantilla para empezar a destacar tus productos.</p>
            <button className="btn btn--primary" style={{ marginTop: 14 }} onClick={openNew}>
              <IconPlus /> Nueva cucarda
            </button>
          </div>
        </div>
      ) : cucardas.length === 0 ? (
        <div className="table-wrap">
          <div className="empty">
            <h3>Sin resultados</h3>
            <p style={{ marginTop: 6 }}>Ninguna cucarda coincide con los filtros.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Asociados</th>
                <th>Vista previa</th>
                <th>Ubicación</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cucardas.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "var(--text-2)" }}>{c.category || "—"}</td>
                  <td>{c._count?.assignments ?? 0}</td>
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", minHeight: 40 }}>
                      <CucardaBadge cucarda={c} />
                    </div>
                  </td>
                  <td style={{ color: "var(--text-2)" }}>{LOCATION_LABELS[c.location]}</td>
                  <td>
                    <span className="pill pill--brand">{TYPE_LABELS[c.type]}</span>
                  </td>
                  <td>
                    {(() => {
                      const s = scheduleStatus(c);
                      return <span className={`pill ${s.cls}`}>{s.label}</span>;
                    })()}
                    {(c.startsAt || c.endsAt) && (
                      <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                        {c.startsAt ? new Date(c.startsAt).toLocaleDateString("es-AR") : "—"}
                        {" → "}
                        {c.endsAt ? new Date(c.endsAt).toLocaleDateString("es-AR") : "∞"}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                      <button
                        className="btn btn--ghost btn--sm"
                        title={c.active ? "Desactivar" : "Activar"}
                        onClick={() => toggleMutation.mutate({ id: c.id, active: !c.active })}
                      >
                        <IconPower />
                      </button>
                      <button className="btn btn--ghost btn--icon" title="Editar" onClick={() => openEdit(c)}>
                        <IconEdit />
                      </button>
                      <button
                        className="btn btn--ghost btn--icon"
                        title="Duplicar"
                        onClick={() => duplicateMutation.mutate(c.id)}
                      >
                        <IconCopy />
                      </button>
                      <button
                        className="btn btn--ghost btn--icon"
                        title="Borrar"
                        style={{ color: "var(--danger)" }}
                        onClick={() => {
                          if (confirm(`¿Borrar "${c.name}"? No se puede deshacer.`)) deleteMutation.mutate(c.id);
                        }}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <CucardaModal cucarda={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
