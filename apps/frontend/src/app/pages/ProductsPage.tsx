import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApplyCucardaModal } from "../components/ApplyCucardaModal";
import { deleteAssignment, listAssignments } from "../../shared/api/assignments";
import { listProducts, productDisplayName } from "../../shared/api/products";
import { CucardaBadge } from "../../shared/cucardas/CucardaBadge";
import { IconSearch, IconTag, IconTrash } from "../../shared/components/icons";

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
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

  const removeMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments-all"] }),
  });

  const assignmentsByProduct = new Map<string, typeof assignmentsQuery.data>();
  for (const assignment of assignmentsQuery.data ?? []) {
    const list = assignmentsByProduct.get(assignment.productId) ?? [];
    list.push(assignment);
    assignmentsByProduct.set(assignment.productId, list);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Productos</h1>
          <div className="page__title-sub">Elegí productos y aplicales una cucarda.</div>
        </div>
        <button className="btn btn--primary" disabled={selected.size === 0} onClick={() => setShowApplyModal(true)}>
          <IconTag /> Aplicar cucarda ({selected.size})
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 360, marginBottom: 18 }}>
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
                <th style={{ width: 36 }}></th>
                <th>Producto</th>
                <th>Cucardas aplicadas</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data?.products.map((product) => {
                const productId = String(product.id);
                const assignments = assignmentsByProduct.get(productId) ?? [];
                const mainImage = product.images[0]?.src;

                return (
                  <tr key={productId}>
                    <td>
                      <input type="checkbox" checked={selected.has(productId)} onChange={() => toggleSelected(productId)} />
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

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </button>
        <span className="muted" style={{ fontSize: 13 }}>
          Página {page}
        </span>
        <button
          className="btn btn--ghost btn--sm"
          disabled={(productsQuery.data?.products.length ?? 0) < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>

      {showApplyModal && (
        <ApplyCucardaModal
          productIds={Array.from(selected)}
          onClose={() => setShowApplyModal(false)}
          onApplied={() => {
            setSelected(new Set());
            queryClient.invalidateQueries({ queryKey: ["assignments-all"] });
          }}
        />
      )}
    </div>
  );
}
