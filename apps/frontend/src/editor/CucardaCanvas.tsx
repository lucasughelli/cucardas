import { useEditor } from "./EditorContext";

export function CucardaCanvas() {
  const { canvasElRef, panMode } = useEditor();

  return (
    <div
      style={{
        border: "1px solid #d4d9dd",
        borderRadius: 8,
        background: "#f7f8f9",
        display: "inline-block",
        padding: 16,
        cursor: panMode ? "grab" : "default",
      }}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
}
