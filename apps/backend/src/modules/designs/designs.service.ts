import { randomUUID } from "node:crypto";
import type {
  CucardaAnimation,
  CucardaCondition,
  CucardaLocation,
  CucardaPosition,
  CucardaSize,
  CucardaType,
  Prisma,
} from "@prisma/client";
import { parseImageDataUrl, uploadObject } from "../../lib/s3";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export interface ListDesignsParams {
  q?: string;
  category?: string;
  type?: CucardaType;
  active?: boolean;
}

/** Config común de una cucarda, compartida por create/update. */
export interface CucardaInput {
  name: string;
  category?: string;
  type: CucardaType;
  active?: boolean;
  // texto
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  // imagen
  canvasJson?: Record<string, unknown>;
  thumbnailDataUrl?: string;
  // display
  location?: CucardaLocation;
  position?: CucardaPosition;
  animation?: CucardaAnimation;
  size?: CucardaSize;
  sizePx?: number | null;
  condition?: CucardaCondition;
  hideNativeBadges?: boolean;
}

export async function listDesigns(storeId: string, params: ListDesignsParams) {
  const where: Prisma.DesignWhereInput = {
    storeId,
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" } } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.active !== undefined ? { active: params.active } : {}),
  };

  return prisma.design.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });
}

async function findOwnedDesign(storeId: string, designId: string) {
  const design = await prisma.design.findFirst({ where: { id: designId, storeId } });
  if (!design) throw new HttpError(404, "Cucarda no encontrada");
  return design;
}

export async function getDesign(storeId: string, designId: string) {
  return findOwnedDesign(storeId, designId);
}

async function uploadThumbnailIfPresent(
  storeId: string,
  designId: string,
  thumbnailDataUrl?: string,
): Promise<string | undefined> {
  if (!thumbnailDataUrl) return undefined;
  const { buffer, contentType, extension } = parseImageDataUrl(thumbnailDataUrl);
  const key = `designs/${storeId}/${designId}/thumbnail-${Date.now()}.${extension}`;
  return uploadObject(key, buffer, contentType);
}

/** Campos opcionales de display + texto comunes, extraídos para no repetir en create/update. */
function displayData(input: Partial<CucardaInput>) {
  return {
    category: input.category,
    active: input.active,
    text: input.text,
    textColor: input.textColor,
    backgroundColor: input.backgroundColor,
    location: input.location,
    position: input.position,
    animation: input.animation,
    size: input.size,
    sizePx: input.sizePx,
    condition: input.condition,
    hideNativeBadges: input.hideNativeBadges,
  };
}

export async function createDesign(storeId: string, input: CucardaInput) {
  const designId = randomUUID();
  const thumbnailUrl = await uploadThumbnailIfPresent(storeId, designId, input.thumbnailDataUrl);
  const canvasJson = input.canvasJson as Prisma.InputJsonValue | undefined;

  return prisma.design.create({
    data: {
      id: designId,
      storeId,
      name: input.name,
      type: input.type,
      ...displayData(input),
      canvasJson,
      thumbnailUrl,
      ...(canvasJson !== undefined ? { versions: { create: { canvasJson } } } : {}),
    },
  });
}

export async function updateDesign(storeId: string, designId: string, input: Partial<CucardaInput>) {
  await findOwnedDesign(storeId, designId);

  const thumbnailUrl = await uploadThumbnailIfPresent(storeId, designId, input.thumbnailDataUrl);
  const canvasJson = input.canvasJson as Prisma.InputJsonValue | undefined;

  return prisma.design.update({
    where: { id: designId },
    data: {
      name: input.name,
      type: input.type,
      ...displayData(input),
      ...(canvasJson !== undefined ? { canvasJson, versions: { create: { canvasJson } } } : {}),
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    },
  });
}

export async function setDesignActive(storeId: string, designId: string, active: boolean) {
  await findOwnedDesign(storeId, designId);
  return prisma.design.update({ where: { id: designId }, data: { active } });
}

export async function deleteDesign(storeId: string, designId: string) {
  await findOwnedDesign(storeId, designId);
  await prisma.design.delete({ where: { id: designId } });
}

export async function duplicateDesign(storeId: string, designId: string, newName?: string) {
  const o = await findOwnedDesign(storeId, designId);
  return prisma.design.create({
    data: {
      storeId,
      name: newName ?? `${o.name} (copia)`,
      category: o.category,
      type: o.type,
      active: o.active,
      text: o.text,
      textColor: o.textColor,
      backgroundColor: o.backgroundColor,
      canvasJson: o.canvasJson as Prisma.InputJsonValue,
      thumbnailUrl: o.thumbnailUrl,
      location: o.location,
      position: o.position,
      animation: o.animation,
      size: o.size,
      sizePx: o.sizePx,
      condition: o.condition,
      hideNativeBadges: o.hideNativeBadges,
      ...(o.canvasJson != null
        ? { versions: { create: { canvasJson: o.canvasJson as Prisma.InputJsonValue } } }
        : {}),
    },
  });
}

export async function listVersions(storeId: string, designId: string) {
  await findOwnedDesign(storeId, designId);
  return prisma.designVersion.findMany({ where: { designId }, orderBy: { createdAt: "desc" } });
}

export async function restoreVersion(storeId: string, designId: string, versionId: string) {
  await findOwnedDesign(storeId, designId);
  const version = await prisma.designVersion.findFirst({ where: { id: versionId, designId } });
  if (!version) throw new HttpError(404, "Versión no encontrada");

  return prisma.design.update({
    where: { id: designId },
    data: {
      canvasJson: version.canvasJson as Prisma.InputJsonValue,
      versions: { create: { canvasJson: version.canvasJson as Prisma.InputJsonValue } },
    },
  });
}
