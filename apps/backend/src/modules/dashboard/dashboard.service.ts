import { prisma } from "../../lib/prisma";

export async function getDashboardSummary(storeId: string) {
  const [activeCucardasCount, productsWithCucardas, recentActivity, recentDesigns] = await Promise.all([
    prisma.assignment.count({ where: { storeId, active: true } }),
    prisma.assignment.findMany({
      where: { storeId, active: true },
      distinct: ["productId"],
      select: { productId: true },
    }),
    prisma.auditLog.findMany({ where: { storeId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.design.findMany({ where: { storeId }, orderBy: { updatedAt: "desc" }, take: 6 }),
  ]);

  return {
    activeCucardasCount,
    productsWithCucardasCount: productsWithCucardas.length,
    recentActivity,
    recentDesigns,
  };
}
