import { prisma } from "../../lib/prisma";

export type EventType = "impression" | "click" | "conversion";

export async function logEvent(
  tnStoreId: string,
  productId: string,
  designId: string,
  type: EventType,
  metadata?: Record<string, unknown>,
) {
  const store = await prisma.store.findUnique({ where: { tnStoreId }, select: { id: true } });
  if (!store) return;

  await prisma.cucardaEvent.create({
    data: {
      storeId: store.id,
      productId,
      designId,
      type,
      metadata: metadata as any || undefined,
    },
  });
}

export interface AnalyticsSummary {
  designId: string;
  designName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // click-through rate
  conversionRate: number;
}

/** Obtener analytics de una cucarda en un rango de fechas. */
export async function getDesignAnalytics(
  storeId: string,
  designId: string,
  startDate: Date,
  endDate: Date,
): Promise<AnalyticsSummary | null> {
  const events = await prisma.cucardaEvent.findMany({
    where: {
      storeId,
      designId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const design = await prisma.design.findUnique({
    where: { id: designId },
    select: { name: true },
  });
  if (!design) return null;

  const impressions = events.filter((e) => e.type === "impression").length;
  const clicks = events.filter((e) => e.type === "click").length;
  const conversions = events.filter((e) => e.type === "conversion").length;

  return {
    designId,
    designName: design.name,
    impressions,
    clicks,
    conversions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
  };
}

/** Todos los diseños con sus stats (para dashboard). */
export async function getStoreAnalytics(
  storeId: string,
  startDate: Date,
  endDate: Date,
): Promise<AnalyticsSummary[]> {
  const designs = await prisma.design.findMany({
    where: { storeId, active: true },
    select: { id: true, name: true },
  });

  const results = [];
  for (const design of designs) {
    const summary = await getDesignAnalytics(storeId, design.id, startDate, endDate);
    if (summary && (summary.impressions > 0 || summary.clicks > 0 || summary.conversions > 0)) {
      results.push(summary);
    }
  }
  return results.sort((a, b) => b.impressions - a.impressions);
}

/** Eventos brutos (para debugging, auditoría). */
export async function getEvents(
  storeId: string,
  designId?: string,
  limit: number = 1000,
) {
  return prisma.cucardaEvent.findMany({
    where: { storeId, ...(designId ? { designId } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
