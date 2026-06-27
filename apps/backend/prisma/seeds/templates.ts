import { prisma } from "../../src/lib/prisma";

export async function seedTemplates() {
  const templates = [
    {
      name: "🆕 Nuevo Producto",
      category: "Moda",
      type: "TEXT" as const,
      text: "NUEVO",
      textColor: "#ffffff",
      backgroundColor: "#ff6b6b",
    },
    {
      name: "💰 Oferta Limitada",
      category: "General",
      type: "TEXT" as const,
      text: "OFERTA",
      textColor: "#ffffff",
      backgroundColor: "#ffa500",
    },
    {
      name: "🚚 Envío Gratis",
      category: "General",
      type: "TEXT" as const,
      text: "ENVÍO GRATIS",
      textColor: "#ffffff",
      backgroundColor: "#51cf66",
    },
    {
      name: "⭐ Premium",
      category: "Electrónica",
      type: "TEXT" as const,
      text: "PREMIUM",
      textColor: "#ffffff",
      backgroundColor: "#7c3aed",
    },
    {
      name: "🔥 Más Vendido",
      category: "General",
      type: "TEXT" as const,
      text: "TOP",
      textColor: "#ffffff",
      backgroundColor: "#dc2626",
    },
    {
      name: "🏆 Imprescindible",
      category: "Alimentos",
      type: "TEXT" as const,
      text: "IMPRESCINDIBLE",
      textColor: "#ffffff",
      backgroundColor: "#ea580c",
    },
  ];

  for (const t of templates) {
    await prisma.design.create({
      data: {
        storeId: "template-store-id", // dummy, se reemplaza per-store
        name: t.name,
        category: t.category,
        type: t.type,
        text: t.text,
        textColor: t.textColor,
        backgroundColor: t.backgroundColor,
        active: true,
      },
    });
  }
  console.log(`✓ ${templates.length} plantillas de design creadas`);
}
