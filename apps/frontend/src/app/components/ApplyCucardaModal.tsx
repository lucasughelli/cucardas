import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createAssignments } from "../../shared/api/assignments";
import { listCucardas } from "../../shared/api/cucardas";
import { CucardaBadge } from "../../shared/cucardas/CucardaBadge";
import { Modal } from "../../shared/components/Modal";

export function ApplyCucardaModal({
  productIds,
  onClose,
  onApplied,
}: {
  productIds: string[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [designId, setDesignId] = useState<string | null>(null);

  const cucardasQuery = useQuery({ queryKey: ["cucardas", "", "", true], queryFn: () => listCucardas({ active: true }) });

  const applyMutation = useMutation({
    mutationFn: () => {
      if (!designId) throw new Error("Elegí una cucarda");
      return createAssignments({ designId, productIds });
    },
    onSuccess: () => {
      onApplied();
      onClose();
    },
  });

  return (
    <Modal
      title={`Aplicar cucarda a ${productIds.length} producto(s)`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={() => applyMutation.mutate()} disabled={!designId || applyMutation.isPending}>
            {applyMutation.isPending ? "Aplicando..." : "Aplicar"}
          </button>
        </>
      }
    >
      {cucardasQuery.isLoading && <p className="muted">Cargando cucardas...</p>}
      {cucardasQuery.data?.length === 0 && (
        <p className="muted">No tenés cucardas activas todavía. Creá una primero en la sección Cucardas.</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {cucardasQuery.data?.map((c) => (
          <button
            key={c.id}
            onClick={() => setDesignId(c.id)}
            className="card"
            style={{
              padding: 10,
              cursor: "pointer",
              borderColor: designId === c.id ? "var(--brand)" : undefined,
              boxShadow: designId === c.id ? "0 0 0 3px var(--brand-soft)" : undefined,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              background: "var(--surface)",
            }}
          >
            <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CucardaBadge cucarda={c} />
            </div>
            <span style={{ fontSize: 12, textAlign: "center", fontWeight: 600 }}>{c.name}</span>
          </button>
        ))}
      </div>

      {applyMutation.isError && <p style={{ color: "var(--danger)", fontSize: 13 }}>No se pudo aplicar la cucarda.</p>}
    </Modal>
  );
}
