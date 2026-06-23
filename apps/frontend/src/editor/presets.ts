import { Group, Rect, Textbox } from "fabric";

export interface PresetDefinition {
  id: string;
  label: string;
  background: string;
  textColor: string;
  shape: "rectangle" | "circle";
}

export const PRESETS: PresetDefinition[] = [
  { id: "nuevo", label: "Nuevo", background: "#1f8a4c", textColor: "#ffffff", shape: "rectangle" },
  { id: "promocion", label: "Promoción", background: "#e0353b", textColor: "#ffffff", shape: "rectangle" },
  { id: "envio-gratis", label: "Envío gratis", background: "#1f5fa8", textColor: "#ffffff", shape: "rectangle" },
  { id: "descuento", label: "-20%", background: "#e0353b", textColor: "#ffffff", shape: "circle" },
  { id: "stock-limitado", label: "Stock limitado", background: "#b8860b", textColor: "#ffffff", shape: "rectangle" },
];

export function createPresetGroup(preset: PresetDefinition): Group {
  const width = preset.shape === "circle" ? 90 : 150;
  const height = preset.shape === "circle" ? 90 : 50;

  const background =
    preset.shape === "circle"
      ? new Rect({ width, height, rx: width / 2, ry: height / 2, fill: preset.background })
      : new Rect({ width, height, rx: 8, ry: 8, fill: preset.background });

  const text = new Textbox(preset.label, {
    width: width - 16,
    left: 8,
    top: height / 2 - 10,
    fontSize: preset.shape === "circle" ? 16 : 18,
    fontWeight: "bold",
    fontFamily: "system-ui, sans-serif",
    fill: preset.textColor,
    textAlign: "center",
    originY: "center",
  });

  return new Group([background, text], { left: 60, top: 60 });
}
