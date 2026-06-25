export type CucardaType = "IMAGE" | "TEXT";
export type CucardaLocation = "PRODUCT_PAGE" | "PRODUCT_GRID" | "BOTH";
export type CucardaPosition = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT" | "CENTER";
export type CucardaAnimation = "NONE" | "PULSE" | "BLINK" | "BOUNCE" | "SHAKE";
export type CucardaSize = "SMALL" | "MEDIUM" | "LARGE";
export type CucardaCondition = "NONE" | "ON_SALE" | "OUT_OF_STOCK" | "IN_STOCK" | "NEW";

export interface Cucarda {
  id: string;
  storeId: string;
  name: string;
  category?: string | null;
  type: CucardaType;
  active: boolean;
  text?: string | null;
  textColor?: string | null;
  backgroundColor?: string | null;
  canvasJson?: Record<string, unknown> | null;
  thumbnailUrl?: string | null;
  location: CucardaLocation;
  position: CucardaPosition;
  animation: CucardaAnimation;
  size: CucardaSize;
  /** Tamaño exacto en px. Si está presente, tiene prioridad sobre "size". */
  sizePx?: number | null;
  condition: CucardaCondition;
  hideNativeBadges: boolean;
  /** Programación: ISO strings. null = sin límite. */
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { assignments: number };
}

export interface CucardaFormValues {
  name: string;
  category?: string;
  type: CucardaType;
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  canvasJson?: Record<string, unknown>;
  thumbnailDataUrl?: string;
  location: CucardaLocation;
  position: CucardaPosition;
  animation: CucardaAnimation;
  size: CucardaSize;
  sizePx?: number | null;
  condition: CucardaCondition;
  hideNativeBadges: boolean;
  /** Programación. En el form se guardan como strings datetime-local; se convierten a ISO al enviar. */
  startsAt?: string | null;
  endsAt?: string | null;
}
