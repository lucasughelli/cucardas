import type { CucardaFormValues } from "./types";

/**
 * Cucardas predefinidas ("plantillas"): combinaciones profesionales listas para usar en un click.
 * Todas son de tipo TEXT (no requieren subir imágenes) y prellenan el formulario de creación.
 * El comercio puede ajustar cualquier campo después de elegir una.
 */
export interface CucardaPreset {
  id: string;
  category: PresetCategory;
  values: Partial<CucardaFormValues>;
}

export type PresetCategory =
  | "Ofertas"
  | "Envíos"
  | "Novedades"
  | "Urgencia"
  | "Cuotas"
  | "Temporada";

export const PRESET_CATEGORIES: PresetCategory[] = [
  "Ofertas",
  "Envíos",
  "Novedades",
  "Urgencia",
  "Cuotas",
  "Temporada",
];

/** Base común: tamaño mediano, posición arriba-izquierda, sin condición. */
function base(values: Partial<CucardaFormValues>): Partial<CucardaFormValues> {
  return {
    type: "TEXT",
    size: "MEDIUM",
    sizePx: 72,
    position: "TOP_LEFT",
    location: "BOTH",
    animation: "NONE",
    condition: "NONE",
    hideNativeBadges: false,
    textColor: "#ffffff",
    ...values,
  };
}

export const CUCARDA_PRESETS: CucardaPreset[] = [
  // ---- Ofertas / Descuentos ----
  { id: "oferta", category: "Ofertas", values: base({ name: "Oferta", text: "OFERTA", backgroundColor: "#e0353b", animation: "PULSE" }) },
  { id: "desc30", category: "Ofertas", values: base({ name: "Descuento 30%", text: "-30%", backgroundColor: "#e0353b" }) },
  { id: "desc50", category: "Ofertas", values: base({ name: "Descuento 50%", text: "-50%", backgroundColor: "#111827" }) },
  { id: "liquidacion", category: "Ofertas", values: base({ name: "Liquidación", text: "LIQUIDACIÓN", backgroundColor: "#dc2626" }) },
  { id: "2x1", category: "Ofertas", values: base({ name: "2x1", text: "2x1", backgroundColor: "#7c3aed", animation: "BOUNCE" }) },

  // ---- Envíos ----
  { id: "envio-gratis", category: "Envíos", values: base({ name: "Envío gratis", text: "ENVÍO GRATIS", backgroundColor: "#059669", condition: "IN_STOCK" }) },
  { id: "free-shipping", category: "Envíos", values: base({ name: "Free shipping", text: "FREE SHIPPING", backgroundColor: "#0d9488" }) },
  { id: "envio-24h", category: "Envíos", values: base({ name: "Envío 24h", text: "ENVÍO 24H", backgroundColor: "#0ea5e9" }) },

  // ---- Novedades ----
  { id: "nuevo", category: "Novedades", values: base({ name: "Nuevo", text: "NUEVO", backgroundColor: "#2563eb", condition: "NEW" }) },
  { id: "new", category: "Novedades", values: base({ name: "New", text: "NEW", backgroundColor: "#111827" }) },
  { id: "recien-llegado", category: "Novedades", values: base({ name: "Recién llegado", text: "RECIÉN LLEGADO", backgroundColor: "#4f46e5", sizePx: 64 }) },

  // ---- Urgencia / Stock ----
  { id: "ultimas", category: "Urgencia", values: base({ name: "Últimas unidades", text: "ÚLTIMAS UNIDADES", backgroundColor: "#dc2626", animation: "BLINK", sizePx: 60, condition: "IN_STOCK" }) },
  { id: "ultimo", category: "Urgencia", values: base({ name: "¡Último!", text: "¡ÚLTIMO!", backgroundColor: "#b91c1c", animation: "BOUNCE" }) },
  { id: "pocas", category: "Urgencia", values: base({ name: "Pocas unidades", text: "POCAS UNIDADES", textColor: "#1f2937", backgroundColor: "#fbbf24", sizePx: 60 }) },

  // ---- Cuotas / Bancario ----
  { id: "3-cuotas", category: "Cuotas", values: base({ name: "3 cuotas", text: "3 CUOTAS", backgroundColor: "#0ea5e9" }) },
  { id: "6-cuotas", category: "Cuotas", values: base({ name: "6 cuotas sin interés", text: "6 CUOTAS S/INTERÉS", backgroundColor: "#0369a1", sizePx: 60 }) },
  { id: "12-cuotas", category: "Cuotas", values: base({ name: "12 cuotas", text: "12 CUOTAS", backgroundColor: "#1e3a8a" }) },

  // ---- Temporada ----
  { id: "black-friday", category: "Temporada", values: base({ name: "Black Friday", text: "BLACK FRIDAY", textColor: "#fbbf24", backgroundColor: "#000000", animation: "PULSE", sizePx: 64 }) },
  { id: "cyber-monday", category: "Temporada", values: base({ name: "Cyber Monday", text: "CYBER MONDAY", backgroundColor: "#6d28d9", sizePx: 64 }) },
  { id: "hot-sale", category: "Temporada", values: base({ name: "Hot Sale", text: "HOT SALE", backgroundColor: "#ea580c", animation: "PULSE" }) },
  { id: "navidad", category: "Temporada", values: base({ name: "Navidad", text: "NAVIDAD", backgroundColor: "#b91c1c" }) },
];
