import type { Textbox } from "fabric";
import { useEditor } from "./EditorContext";

const FONT_FAMILIES = ["system-ui, sans-serif", "Georgia, serif", "'Courier New', monospace", "Verdana, sans-serif"];
const COLOR_PALETTE = ["#1a1a1a", "#ffffff", "#e0353b", "#1f8a4c", "#1f5fa8", "#b8860b", "#7a1fa8"];

export function PropertiesPanel() {
  const { selectedObject, updateSelected } = useEditor();

  if (!selectedObject) {
    return (
      <div className="card" style={{ width: 260 }}>
        <p style={{ color: "#5b6770", fontSize: 14, margin: 0 }}>
          Seleccioná un elemento del lienzo para editar sus propiedades.
        </p>
      </div>
    );
  }

  const isText = selectedObject.type === "Textbox";
  const textObject = isText ? (selectedObject as Textbox) : null;

  return (
    <div className="card" style={{ width: 260, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6770" }}>Color</label>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => updateSelected({ fill: color })}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: color,
                border: "1px solid #d4d9dd",
                cursor: "pointer",
              }}
              aria-label={`Color ${color}`}
            />
          ))}
          <input
            type="color"
            onChange={(e) => updateSelected({ fill: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, border: "none" }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6770" }}>Rotación</label>
        <input
          className="input"
          type="range"
          min={0}
          max={360}
          value={Math.round(selectedObject.angle ?? 0)}
          onChange={(e) => updateSelected({ angle: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </div>

      {isText && textObject && (
        <>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6770" }}>Tipografía</label>
            <select
              className="select"
              style={{ width: "100%", marginTop: 6 }}
              value={textObject.fontFamily}
              onChange={(e) => updateSelected({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font.split(",")[0].replace(/'/g, "")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6770" }}>Tamaño</label>
            <input
              className="input"
              type="number"
              min={8}
              max={120}
              value={textObject.fontSize}
              onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 6 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6770" }}>Peso</label>
            <select
              className="select"
              style={{ width: "100%", marginTop: 6 }}
              value={String(textObject.fontWeight)}
              onChange={(e) => updateSelected({ fontWeight: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="bold">Negrita</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5b6770" }}>Alineación</label>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  className={`btn secondary${textObject.textAlign === align ? " active" : ""}`}
                  onClick={() => updateSelected({ textAlign: align })}
                  style={{ flex: 1, padding: "6px 0" }}
                >
                  {align === "left" ? "Izq" : align === "center" ? "Centro" : "Der"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
