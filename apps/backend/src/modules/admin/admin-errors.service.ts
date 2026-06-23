import type { ErrorLevel, ErrorSource, Prisma } from "@prisma/client";
import { toCsv } from "../../lib/csv";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export interface ErrorsFilter {
  q?: string;
  level?: ErrorLevel;
  source?: ErrorSource;
  storeId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  perPage?: number;
}

function buildWhere(filter: ErrorsFilter): Prisma.ErrorLogWhereInput {
  return {
    level: filter.level,
    source: filter.source,
    storeId: filter.storeId,
    ...(filter.q ? { message: { contains: filter.q, mode: "insensitive" } } : {}),
    ...(filter.from || filter.to
      ? { createdAt: { gte: filter.from, lte: filter.to } }
      : {}),
  };
}

export async function listErrors(filter: ErrorsFilter) {
  const page = filter.page ?? 1;
  const perPage = filter.perPage ?? 25;
  const where = buildWhere(filter);

  const [items, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { store: { select: { name: true, tnStoreId: true } } },
    }),
    prisma.errorLog.count({ where }),
  ]);

  return { items, total, page, perPage };
}

export async function getErrorDetail(id: string) {
  const error = await prisma.errorLog.findUnique({ where: { id }, include: { store: true } });
  if (!error) throw new HttpError(404, "Error no encontrado");
  return error;
}

/** Agrupa errores por mensaje para detectar patrones recurrentes. */
export async function groupErrorsByPattern() {
  const grouped = await prisma.errorLog.groupBy({
    by: ["message", "level", "source"],
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _count: { message: "desc" } },
    take: 50,
  });

  return grouped.map((g) => ({
    message: g.message,
    level: g.level,
    source: g.source,
    count: g._count._all,
    lastSeen: g._max.createdAt,
  }));
}

export async function exportErrorsCsv(filter: ErrorsFilter): Promise<string> {
  const where = buildWhere(filter);
  const items = await prisma.errorLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { store: { select: { name: true, tnStoreId: true } } },
  });

  return toCsv(
    ["id", "createdAt", "level", "source", "store", "message"],
    items.map((e) => [e.id, e.createdAt.toISOString(), e.level, e.source, e.store?.name ?? e.store?.tnStoreId ?? "", e.message]),
  );
}
