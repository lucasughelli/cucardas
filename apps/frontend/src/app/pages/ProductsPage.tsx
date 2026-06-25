import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ApplyCucardaModal } from "../components/ApplyCucardaModal";
import {
  bulkRemoveAssignments,
  deleteAssignment,
  listAssignments,
} from "../../shared/api/assignments";
import { listProducts, productDisplayName } from "../../shared/api/products";
import { CucardaBadge } from "../../shared/cucardas/CucardaBadge";
import { IconBox, IconSearch, IconTag, IconTrash } from "../../shared/components/icons";

type StatusFilter = "all" | "with" | "without";

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", page, search],
    queryFn: () => listProducts({ page, perPage: 20, q: search || undefined }),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments-all"],
    queryFn: () => listAssignments(),
  });

  const invalidateAssignments = () => queryClient.invalidateQueries({ queryKey: ["assignments-all"] });

  const removeMutation = useMutation({ mutationFn: deleteAssignment, onSuccess: invalidateAssignments });
  const bulkRemoveMutation = useMutation({
    mutationFn: bulkRemoveAssignments,
    onSuccess: () => {
      setSelected(new Set());
      invalidateAssignments();
    },
  });

  const assignmentsByProduct = useMemo(() => {
    const map = new Map<string, NonNullable<typeof assignmentsQuery.data>>();
    for (const assignment of assignmentsQuery.data ?? []) {
      const list = map.get(assignment.productId) ?? [];
      list.push(assignment);
      map.set(assignment.productId, list);
    }
    return map;
  }, [assignmentsQuery.data]);

  const allProducts = productsQuery.data?.products ?? [];
  const products = useMemo(
    () =>
      allProducts.filter((p) => {
        const has = (assignmentsByProduct.get(String(p.id))?.length ?? 0) > 0;
        if (statusFilter === "with") return has;
        if (statusFilter === "without") return !has;
        return true;
      }),
    [allProducts, assignmentsByProduct, statusFilter],
  );

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleIds = products.map((p) => String(p.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  // ¿Cuántos de los seleccionados tienen al menos una cucarda? (para habilitar "Quitar")
  const selectedWithCucardas = Array.from(selected).filter(
    (id) => (assignmentsByProduct.get(id)?.length ?? 0) > 0,
  );

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Productos</h1>
          <div className="page__title-sub">Elegí productos y aplicales (o quitales) cucardas en lote.</div>
        </div>
      </div>

      {/* ---- Filtros ---- */}
      <div className="row" style={{ marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 360 }}>
          <IconSearch style={{ position: "absolute", left: 11, top: 9, width: 16, height: 16, color: "var(--text-3)" }} />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="select"
          style={{ width: 200 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Todos los productos</option>
          <option value="with">Con cucarda aplicada</option>
          <option value="without">Sin cucarda</option>
        </select>
      </div>

      {/* ---- Barra de acciones masivas (sticky cuando hay selección) ---- */}
      {selected.size > 0 && (
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            marginBottom: 14,
            borderColor: "var(--brand)",
            background: "var(--brand-soft)",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14 }}>{selected.size} seleccionado(s)</span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setSelected(new Set())}>
              Limpiar
            </button>
            <button
              className="btn btn--ghost btn--sm"
              style={{ color: "var(--danger)" }}
              disabled={selectedWithCucardas.length === 0 || bulkRemoveMutation.isPending}
              onClick={() => {
                if (confirm(`¿Quitar las cucardas de ${selectedWithCucardas.length} producto(s)?`)) {
                  bulkRemoveMutation.mutate(selectedWithCucardas);
                }
              }}
            >
              <IconTrash /> Quitar cucardas ({selectedWithCucardas.length})
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => setShowApplyModal(true)}>
              <IconTag /> Aplicar cucarda ({selected.size})
            </button>
          </div>
        </div>
      )}

      {productsQuery.isLoading && <div className="empty">Cargando productos...</div>}
      {productsQuery.isError && (
        <div className="empty" style={{ color: "var(--danger)" }}>
          No se pudieron cargar los productos. Verificá la conexión con Tiendanube.
        </div>
      )}

      {!productsQuery.isLoading && !productsQuery.isError && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    title="Seleccionar todos"
                  />
                </th>
                <th>Producto</th>
                <th>Cucardas aplicadas</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty" style={{ padding: 28 }}>
                      <div className="empty__icon">
                        <IconBox style={{ width: 36, height: 36, color: "var(--text-3)" }} />
                      </div>
                      <p style={{ marginTop: 6 }}>
                        {statusFilter === "with"
                          ? "Ningún producto de esta página tiene cucardas."
                          : statusFilter === "without"
                            ? "Todos los productos de esta página tienen cucardas."
                            : "No hay productos para mostrar."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {products.map((product) => {
                const productId = String(product.id);
                const assignments = assignmentsByProduct.get(productId) ?? [];
                const mainImage = product.images[0]?.src;
                const isSelected = selected.has(productId);

                return (
                  <tr key={productId} style={isSelected ? { background: "var(--brand-soft)" } : undefined}>
                    <td>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(productId)} />
                    </td>
                    <td>
                      <div className="row">
                        {mainImage ? (
                          <img src={mainImage} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: "var(--surface-2)", borderRadius: 6 }} />
                        )}
                        <span style={{ fontWeight: 600 }}>{productDisplayName(product)}</span>
                      </div>
                    </td>
                    <td>
                      {assignments.length === 0 ? (
                        <span className="muted">Ninguna</span>
                      ) : (
                        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                          {assignments.map((assignment) => (
                            <span key={assignment.id} className="pill pill--success" style={{ gap: 8 }}>
                              <CucardaBadge cucarda={assignment.design} />
                              {assignment.design.name}
                              <button
                                onClick={() => removeMutation.mutate(assignment.id)}
                                title="Quitar"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--success)", display: "flex" }}
                              >
                                <IconTrash style={{ width: 13, height: 13 }} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
        <span className="muted" style={{ fontSize: 13 }}>
          {statusFilter !== "all" && `Mostrando ${products.length} de ${allProducts.length} en esta página · `}
          Página {page}
        </span>
        <div className="row">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <button
            className="btn btn--ghost btn--sm"
            disabled={allProducts.length < 20}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {showApplyModal && (
        <ApplyCucardaModal
          productIds={Array.from(selected)}
          onClose={() => setShowApplyModal(false)}
          onApplied={() => {
            setSelected(new Set());
            invalidateAssignments();
          }}
        />
      )}
    </div>
  );
}
