import type { Design, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { TtlCache } from "../../lib/ttlCache";

/** Lo que el widget del storefront necesita para renderizar una cucarda sobre un producto. */
export interface PublicAssignment {
  productId: string;
  type: "image" | "text";
  imageUrl: string | null;
  text: string | null;
  textColor: string | null;
  backgroundColor: string | null;
  position: string;
  animation: string;
  size: string;
  sizePx: number | null;
  condition: string;
  location: string;
  hideNativeBadges: boolean;
}

const publicAssignmentsCache = new TtlCache<PublicAssignment[]>(60_000);

function toWidgetAssignment(productId: string, design: Design): PublicAssignment {
  return {
    productId,
    type: design.type === "TEXT" ? "text" : "image",
    imageUrl: design.thumbnailUrl ?? null,
    text: design.text ?? null,
    textColor: design.textColor ?? null,
    backgroundColor: design.backgroundColor ?? null,
    position: design.position.toLowerCase().replace("_", "-"),
    animation: design.animation.toLowerCase(),
    size: design.size.toLowerCase(),
    sizePx: design.sizePx ?? null,
    condition: design.condition.toLowerCase(),
    location: design.location.toLowerCase(),
    hideNativeBadges: design.hideNativeBadges,
  };
}

async function assertDesignOwnedByStore(storeId: string, designId: string) {
  const design = await prisma.design.findFirst({ where: { id: designId, storeId } });
  if (!design) throw new HttpError(404, "Diseño no encontrado");
}

export async function listAssignments(storeId: string, productId?: string) {
  const where: Prisma.AssignmentWhereInput = { storeId, ...(productId ? { productId } : {}) };
  return prisma.assignment.findMany({
    where,
    include: {
      design: {
        select: {
          id: true,
          name: true,
          type: true,
          text: true,
          textColor: true,
          backgroundColor: true,
          thumbnailUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAssignments(
  storeId: string,
  input: { designId: string; productIds: string[] },
) {
  await assertDesignOwnedByStore(storeId, input.designId);

  // Evita duplicar la misma cucarda en un producto que ya la tiene.
  const existing = await prisma.assignment.findMany({
    where: { storeId, designId: input.designId, productId: { in: input.productIds } },
    select: { productId: true },
  });
  const alreadyAssigned = new Set(existing.map((a) => a.productId));
  const toCreate = input.productIds.filter((id) => !alreadyAssigned.has(id));

  const created = await prisma.$transaction(
    toCreate.map((productId) =>
      prisma.assignment.create({
        data: { storeId, designId: input.designId, productId, active: true },
      }),
    ),
  );

  await prisma.auditLog.create({
    data: {
      storeId,
      action: "assignment.created",
      entityType: "assignment",
      metadata: { designId: input.designId, productIds: input.productIds },
    },
  });

  return created;
}

export async function setAssignmentActive(storeId: string, assignmentId: string, active: boolean) {
  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, storeId } });
  if (!assignment) throw new HttpError(404, "Asignación no encontrada");

  const updated = await prisma.assignment.update({ where: { id: assignmentId }, data: { active } });

  await prisma.auditLog.create({
    data: {
      storeId,
      action: active ? "assignment.activated" : "assignment.deactivated",
      entityType: "assignment",
      entityId: assignmentId,
    },
  });

  return updated;
}

export async function deleteAssignment(storeId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, storeId } });
  if (!assignment) throw new HttpError(404, "Asignación no encontrada");

  await prisma.assignment.delete({ where: { id: assignmentId } });

  await prisma.auditLog.create({
    data: { storeId, action: "assignment.deleted", entityType: "assignment", entityId: assignmentId },
  });
}

/** Quita TODAS las cucardas de un conjunto de productos (acción masiva). Devuelve cuántas borró. */
export async function removeAssignmentsForProducts(
  storeId: string,
  productIds: string[],
): Promise<number> {
  if (productIds.length === 0) return 0;

  const result = await prisma.assignment.deleteMany({
    where: { storeId, productId: { in: productIds } },
  });

  if (result.count > 0) {
    await prisma.auditLog.create({
      data: {
        storeId,
        action: "assignment.bulk_deleted",
        entityType: "assignment",
        metadata: { productIds, count: result.count },
      },
    });
  }
  return result.count;
}

/** Una cucarda es renderizable si es de texto con contenido, o de imagen con thumbnail. */
function isRenderable(design: Design): boolean {
  if (design.type === "TEXT") return Boolean(design.text && design.text.trim());
  return Boolean(design.thumbnailUrl);
}

/**
 * Cucarda vigente para el storefront: activa y dentro de su ventana de programación
 * (startsAt null = desde siempre, endsAt null = sin fin). Así una cucarda programada solo
 * empieza/deja de mostrarse en su fecha, sin intervención manual.
 */
function activeDesignWhere(now: Date): Prisma.DesignWhereInput {
  return {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

/** Usado por el widget público del storefront — sin auth, así que se cachea agresivamente. */
export async function getPublicAssignments(tnStoreId: string, productId: string): Promise<PublicAssignment[]> {
  const cacheKey = `${tnStoreId}:${productId}`;
  const cached = publicAssignmentsCache.get(cacheKey);
  if (cached) return cached;

  const rows = await prisma.assignment.findMany({
    where: {
      productId,
      active: true,
      store: { tnStoreId, status: "ACTIVE" },
      design: activeDesignWhere(new Date()),
    },
    include: { design: true },
  });

  const result = rows
    .filter((row) => isRenderable(row.design))
    .map((row) => toWidgetAssignment(row.productId, row.design));

  publicAssignmentsCache.set(cacheKey, result);
  return result;
}

/** Versión batch: para páginas de grilla/listado donde hay muchos productos a la vez. */
export async function getPublicAssignmentsBatch(
  tnStoreId: string,
  productIds: string[],
): Promise<PublicAssignment[]> {
  if (productIds.length === 0) return [];

  const rows = await prisma.assignment.findMany({
    where: {
      productId: { in: productIds },
      active: true,
      store: { tnStoreId, status: "ACTIVE" },
      design: activeDesignWhere(new Date()),
    },
    include: { design: true },
  });

  return rows
    .filter((row) => isRenderable(row.design))
    .map((row) => toWidgetAssignment(row.productId, row.design));
}
