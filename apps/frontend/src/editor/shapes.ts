import { Path, Rect, Circle, type FabricObject } from "fabric";

const DEFAULT_FILL = "#e0353b";

export function createRectangle(): FabricObject {
  return new Rect({
    left: 50,
    top: 50,
    width: 140,
    height: 60,
    rx: 8,
    ry: 8,
    fill: DEFAULT_FILL,
  });
}

export function createCircle(): FabricObject {
  return new Circle({
    left: 50,
    top: 50,
    radius: 50,
    fill: DEFAULT_FILL,
  });
}

/** Cinta diagonal típica de "oferta"/"descuento", como un paralelogramo con puntas. */
export function createRibbon(): FabricObject {
  const path =
    "M 0 20 L 20 0 L 180 0 L 200 20 L 180 40 L 20 40 Z";
  return new Path(path, {
    left: 30,
    top: 60,
    fill: DEFAULT_FILL,
  });
}

/** Bandera con cola en punta (forma de "etiqueta"). */
export function createFlag(): FabricObject {
  const path = "M 0 0 L 140 0 L 140 50 L 70 70 L 0 50 Z";
  return new Path(path, {
    left: 40,
    top: 40,
    fill: DEFAULT_FILL,
  });
}

export const SHAPE_LIBRARY = [
  { id: "rectangle", label: "Rectángulo", create: createRectangle },
  { id: "circle", label: "Círculo", create: createCircle },
  { id: "ribbon", label: "Cinta", create: createRibbon },
  { id: "flag", label: "Bandera", create: createFlag },
] as const;

export type ShapeId = (typeof SHAPE_LIBRARY)[number]["id"];
