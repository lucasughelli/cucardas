import { PRESETS } from "./presets";
import { useEditor } from "./EditorContext";

export function PresetGallery() {
  const { addPreset } = useEditor();

  return (
    <div className="card" style={{ width: 200, display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>Presets</h3>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => addPreset(preset)}
          style={{
            background: preset.background,
            color: preset.textColor,
            border: "none",
            borderRadius: preset.shape === "circle" ? 100 : 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
