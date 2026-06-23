import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CucardaCanvas } from "../../editor/CucardaCanvas";
import { EditorProvider, useEditor } from "../../editor/EditorContext";
import { EditorToolbar } from "../../editor/EditorToolbar";
import { PresetGallery } from "../../editor/PresetGallery";
import { PropertiesPanel } from "../../editor/PropertiesPanel";
import { createCucarda, getCucarda, updateCucarda } from "../../shared/api/cucardas";

const CATEGORIES = ["General", "Promoción", "Envío", "Stock", "Temporada"];

function EditorPageContent({ designId }: { designId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canvas, loadDesign, getCanvasJson, exportPNG } = useEditor();

  const [name, setName] = useState("Nueva cucarda");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loadedDesignId, setLoadedDesignId] = useState<string | undefined>(undefined);

  const designQuery = useQuery({
    queryKey: ["cucarda", designId],
    queryFn: () => getCucarda(designId as string),
    enabled: Boolean(designId),
  });

  useEffect(() => {
    if (!canvas || !designQuery.data || loadedDesignId === designQuery.data.id) return;
    setName(designQuery.data.name);
    setCategory(designQuery.data.category ?? CATEGORIES[0]);
    if (designQuery.data.canvasJson) {
      void loadDesign(designQuery.data.canvasJson).then(() => setLoadedDesignId(designQuery.data!.id));
    } else {
      setLoadedDesignId(designQuery.data.id);
    }
  }, [canvas, designQuery.data, loadDesign, loadedDesignId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const canvasJson = getCanvasJson();
      const thumbnailDataUrl = exportPNG(2);
      if (designId) {
        return updateCucarda(designId, { name, category, canvasJson, thumbnailDataUrl });
      }
      // El editor de lienzo siempre produce una cucarda de tipo Imagen.
      return createCucarda({
        name,
        category,
        type: "IMAGE",
        canvasJson,
        thumbnailDataUrl,
        location: "PRODUCT_PAGE",
        position: "TOP_LEFT",
        animation: "NONE",
        size: "SMALL",
        condition: "NONE",
        hideNativeBadges: false,
      });
    },
    onSuccess: (design) => {
      queryClient.invalidateQueries({ queryKey: ["cucardas"] });
      if (!designId) navigate(`/editor/${design.id}`, { replace: true });
    },
  });

  return (
    <div className="page">
      <div className="page__header">
        <div className="row" style={{ gap: 12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate("/cucardas")}>
            ← Volver
          </button>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la cucarda"
            style={{ width: 240 }}
          />
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 160 }}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn--primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Guardando..." : "Guardar cucarda"}
        </button>
      </div>

      <EditorToolbar />

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <PresetGallery />
        <CucardaCanvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}

export function EditorPage() {
  const { designId } = useParams<{ designId: string }>();
  return (
    <EditorProvider>
      <EditorPageContent designId={designId} />
    </EditorProvider>
  );
}
