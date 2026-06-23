import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCucarda, updateCucarda } from "../../shared/api/cucardas";
import { CucardaBadge } from "../../shared/cucardas/CucardaBadge";
import {
  ANIMATION_LABELS,
  CONDITION_LABELS,
  LOCATION_LABELS,
  POSITION_LABELS,
  SIZE_PX,
} from "../../shared/cucardas/labels";
import type {
  Cucarda,
  CucardaAnimation,
  CucardaCondition,
  CucardaFormValues,
  CucardaLocation,
  CucardaPosition,
  CucardaSize,
  CucardaType,
} from "../../shared/cucardas/types";
import { CUCARDA_PRESETS, PRESET_CATEGORIES, type CucardaPreset, type PresetCategory } from "../../shared/cucardas/presets";
import { Modal } from "../../shared/components/Modal";
import { Switch } from "../../shared/components/Switch";

const POSITION_STYLE: Record<CucardaPosition, React.CSSProperties> = {
  TOP_LEFT: { top: 10, left: 10 },
  TOP_RIGHT: { top: 10, right: 10 },
  BOTTOM_LEFT: { bottom: 10, left: 10 },
  BOTTOM_RIGHT: { bottom: 10, right: 10 },
  CENTER: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function defaults(cucarda?: Cucarda): CucardaFormValues {
  return {
    name: cucarda?.name ?? "",
    category: cucarda?.category ?? "",
    type: cucarda?.type ?? "TEXT",
    text: cucarda?.text ?? "",
    textColor: cucarda?.textColor ?? "#ffffff",
    backgroundColor: cucarda?.backgroundColor ?? "#e0353b",
    thumbnailDataUrl: undefined,
    location: cucarda?.location ?? "PRODUCT_PAGE",
    position: cucarda?.position ?? "TOP_LEFT",
    animation: cucarda?.animation ?? "NONE",
    size: cucarda?.size ?? "SMALL",
    sizePx: cucarda?.sizePx ?? SIZE_PX[cucarda?.size ?? "SMALL"],
    condition: cucarda?.condition ?? "NONE",
    hideNativeBadges: cucarda?.hideNativeBadges ?? false,
  };
}

export function CucardaModal({ cucarda, onClose }: { cucarda?: Cucarda; onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<CucardaFormValues>(() => defaults(cucarda));
  // Preview de imagen: la que sube ahora, o la ya guardada al editar.
  const [previewImage, setPreviewImage] = useState<string | null>(cucarda?.thumbnailUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [presetCat, setPresetCat] = useState<PresetCategory>(PRESET_CATEGORIES[0]);

  function set<K extends keyof CucardaFormValues>(key: K, value: CucardaFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Aplica una plantilla: prellena el formulario y limpia cualquier imagen previa (los presets son TEXT).
  function applyPreset(preset: CucardaPreset) {
    setForm((f) => ({ ...f, ...preset.values }));
    setPreviewImage(null);
    setError(null);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form.name.trim()) throw new Error("Poné un nombre");
      if (form.type === "TEXT" && !form.text?.trim()) throw new Error("Las cucardas de texto necesitan un texto");
      if (form.type === "IMAGE" && !form.thumbnailDataUrl && !cucarda?.thumbnailUrl) {
        throw new Error("Subí una imagen para la cucarda");
      }
      const payload: CucardaFormValues = { ...form, category: form.category?.trim() || undefined };
      return cucarda ? updateCucarda(cucarda.id, payload) : createCucarda(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cucardas"] });
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo guardar"),
  });

  async function handleFile(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    set("thumbnailDataUrl", dataUrl);
    setPreviewImage(dataUrl);
  }

  const previewCucarda = {
    type: form.type,
    text: form.text,
    textColor: form.textColor,
    backgroundColor: form.backgroundColor,
    thumbnailUrl: previewImage,
    size: form.size,
    sizePx: form.sizePx,
    animation: form.animation,
  };

  return (
    <Modal
      title={cucarda ? "Editar cucarda" : "Nueva cucarda"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : "Guardar cucarda"}
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        {/* ---- Formulario ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Galería de plantillas: solo al crear una cucarda nueva */}
          {!cucarda && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 14,
                background: "var(--surface-2)",
              }}
            >
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <label className="label" style={{ margin: 0 }}>✨ Empezá con una plantilla</label>
                <span className="help">Elegí una y ajustá lo que quieras</span>
              </div>
              <div className="tabs" style={{ flexWrap: "wrap", marginBottom: 12 }}>
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`tab${presetCat === cat ? " active" : ""}`}
                    onClick={() => setPresetCat(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CUCARDA_PRESETS.filter((p) => p.category === presetCat).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    title={`Usar "${preset.values.name}"`}
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      minHeight: 44,
                    }}
                  >
                    <CucardaBadge
                      cucarda={{
                        type: "TEXT",
                        text: preset.values.text,
                        textColor: preset.values.textColor,
                        backgroundColor: preset.values.backgroundColor,
                        size: preset.values.size,
                        sizePx: 48,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="field">
              <label className="label">Nombre *</label>
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Envío gratis" />
            </div>
            <div className="field">
              <label className="label">Categoría</label>
              <input
                className="input"
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="field">
            <label className="label">Tipo</label>
            <div className="tabs" style={{ alignSelf: "flex-start" }}>
              {(["TEXT", "IMAGE"] as CucardaType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tab${form.type === t ? " active" : ""}`}
                  onClick={() => set("type", t)}
                >
                  {t === "TEXT" ? "Texto" : "Imagen"}
                </button>
              ))}
            </div>
          </div>

          {form.type === "TEXT" ? (
            <>
              <div className="field">
                <label className="label">Texto de la cucarda *</label>
                <input className="input" value={form.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Ej: ¡Nuevo!" maxLength={60} />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label className="label">Color de texto</label>
                  <div className="row">
                    <input type="color" value={form.textColor} onChange={(e) => set("textColor", e.target.value)} style={{ width: 40, height: 36, padding: 2, border: "1px solid var(--border-strong)", borderRadius: 6 }} />
                    <input className="input" value={form.textColor} onChange={(e) => set("textColor", e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Color de fondo</label>
                  <div className="row">
                    <input type="color" value={form.backgroundColor} onChange={(e) => set("backgroundColor", e.target.value)} style={{ width: 40, height: 36, padding: 2, border: "1px solid var(--border-strong)", borderRadius: 6 }} />
                    <input className="input" value={form.backgroundColor} onChange={(e) => set("backgroundColor", e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="field">
              <label className="label">Imagen de la cucarda *</label>
              <input
                className="input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <span className="help">
                Subí un PNG/SVG con fondo transparente, o{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/editor");
                  }}
                >
                  diseñala desde cero en el editor avanzado
                </a>
                .
              </span>
            </div>
          )}

          <div className="form-grid">
            <div className="field">
              <label className="label">Ubicación</label>
              <select className="select" value={form.location} onChange={(e) => set("location", e.target.value as CucardaLocation)}>
                {Object.entries(LOCATION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Posición</label>
              <select className="select" value={form.position} onChange={(e) => set("position", e.target.value as CucardaPosition)}>
                {Object.entries(POSITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Condición</label>
              <select className="select" value={form.condition} onChange={(e) => set("condition", e.target.value as CucardaCondition)}>
                {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Animación</label>
              <select className="select" value={form.animation} onChange={(e) => set("animation", e.target.value as CucardaAnimation)}>
                {Object.entries(ANIMATION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Tamaño ({form.sizePx ?? SIZE_PX[form.size]}px)</label>
              <div className="row" style={{ gap: 10 }}>
                <input
                  className="input"
                  type="range"
                  min={16}
                  max={300}
                  value={form.sizePx ?? SIZE_PX[form.size]}
                  onChange={(e) => set("sizePx", Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input
                  className="input"
                  type="number"
                  min={16}
                  max={300}
                  value={form.sizePx ?? SIZE_PX[form.size]}
                  onChange={(e) => set("sizePx", Number(e.target.value))}
                  style={{ width: 70 }}
                />
              </div>
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                {(["SMALL", "MEDIUM", "LARGE"] as CucardaSize[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      set("size", s);
                      set("sizePx", SIZE_PX[s]);
                    }}
                  >
                    {s === "SMALL" ? "Chica" : s === "MEDIUM" ? "Mediana" : "Grande"}
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label className="label">Ocultar cucardas nativas de Tiendanube</label>
              <div className="row">
                <Switch checked={form.hideNativeBadges} onChange={(v) => set("hideNativeBadges", v)} />
                <span className="help">Tapa las cucardas que pone Tiendanube por defecto</span>
              </div>
            </div>
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        </div>

        {/* ---- Preview en vivo ---- */}
        <div>
          <label className="label" style={{ marginBottom: 8, display: "block" }}>Vista previa</label>
          <div
            style={{
              position: "relative",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              aspectRatio: "1 / 1",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 6 }}>🧦</div>
              Foto del producto
            </div>
            <div style={{ position: "absolute", ...POSITION_STYLE[form.position] }}>
              <CucardaBadge cucarda={previewCucarda} animate />
            </div>
          </div>
          <p className="help" style={{ marginTop: 10 }}>
            Así se va a ver la cucarda sobre la imagen del producto en tu tienda.
          </p>
        </div>
      </div>
    </Modal>
  );
}
