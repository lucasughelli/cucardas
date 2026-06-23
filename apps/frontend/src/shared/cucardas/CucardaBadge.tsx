import { ANIMATION_CLASS, SIZE_FONT, SIZE_PX } from "./labels";
import type { CucardaAnimation, CucardaSize, CucardaType } from "./types";

interface BadgeLike {
  type: CucardaType;
  text?: string | null;
  textColor?: string | null;
  backgroundColor?: string | null;
  thumbnailUrl?: string | null;
  size?: CucardaSize;
  sizePx?: number | null;
  animation?: CucardaAnimation;
}

/** Render visual de una cucarda (texto o imagen), reutilizado en lista, modal y productos. */
export function CucardaBadge({ cucarda, animate = false }: { cucarda: BadgeLike; animate?: boolean }) {
  const size = cucarda.size ?? "SMALL";
  const widthPx = cucarda.sizePx || SIZE_PX[size];
  // La fuente del texto sigue siendo proporcional al ancho efectivo (igual que en el widget).
  const fontSize = cucarda.sizePx ? Math.round(cucarda.sizePx * 0.28) : SIZE_FONT[size];
  const animClass = animate ? ANIMATION_CLASS[cucarda.animation ?? "NONE"] : "";

  if (cucarda.type === "TEXT") {
    return (
      <span
        className={animClass}
        style={{
          display: "inline-block",
          background: cucarda.backgroundColor ?? "#e0353b",
          color: cucarda.textColor ?? "#ffffff",
          fontSize,
          fontWeight: 700,
          borderRadius: 6,
          padding: "0.4em 0.7em",
          whiteSpace: "nowrap",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
          lineHeight: 1,
        }}
      >
        {cucarda.text || "Texto"}
      </span>
    );
  }

  if (cucarda.thumbnailUrl) {
    return (
      <img
        className={animClass}
        src={cucarda.thumbnailUrl}
        alt=""
        style={{ width: widthPx, height: "auto", display: "block" }}
      />
    );
  }

  return (
    <span className="muted" style={{ fontSize: 11 }}>
      Sin preview
    </span>
  );
}
