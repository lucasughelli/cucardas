import { useRef } from "react";
import { SHAPE_LIBRARY } from "./shapes";
import { useEditor } from "./EditorContext";

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

export function EditorToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    addShape,
    addText,
    addImageFromFile,
    deleteSelected,
    selectedObject,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    snapEnabled,
    toggleSnap,
    panMode,
    togglePanMode,
    exportPNG,
    exportSVG,
    exportPDF,
  } = useEditor();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 16 }}>
      {SHAPE_LIBRARY.map((shape) => (
        <button key={shape.id} className="btn secondary" onClick={() => addShape(shape.id)}>
          {shape.label}
        </button>
      ))}
      <button className="btn secondary" onClick={addText}>
        Texto
      </button>
      <button className="btn secondary" onClick={() => fileInputRef.current?.click()}>
        Imagen
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void addImageFromFile(file);
          e.target.value = "";
        }}
      />

      <span style={{ width: 1, height: 24, background: "#d4d9dd" }} />

      <button className="btn secondary" onClick={undo} disabled={!canUndo} title="Deshacer">
        ↶ Deshacer
      </button>
      <button className="btn secondary" onClick={redo} disabled={!canRedo} title="Rehacer">
        ↷ Rehacer
      </button>
      <button className="btn danger" onClick={deleteSelected} disabled={!selectedObject}>
        Eliminar
      </button>

      <span style={{ width: 1, height: 24, background: "#d4d9dd" }} />

      <button className="btn secondary" onClick={zoomOut}>
        −
      </button>
      <span style={{ fontSize: 13, minWidth: 42, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
      <button className="btn secondary" onClick={zoomIn}>
        +
      </button>
      <button className="btn secondary" onClick={resetZoom}>
        100%
      </button>
      <button className={`btn secondary${panMode ? " active" : ""}`} onClick={togglePanMode}>
        Mover lienzo
      </button>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <input type="checkbox" checked={snapEnabled} onChange={toggleSnap} />
        Snap a grilla
      </label>

      <span style={{ width: 1, height: 24, background: "#d4d9dd" }} />

      <button className="btn secondary" onClick={() => downloadDataUrl(exportPNG(), "cucarda.png")}>
        Exportar PNG
      </button>
      <button className="btn secondary" onClick={() => downloadText(exportSVG(), "cucarda.svg", "image/svg+xml")}>
        Exportar SVG
      </button>
      <button className="btn secondary" onClick={exportPDF}>
        Exportar PDF
      </button>
    </div>
  );
}
