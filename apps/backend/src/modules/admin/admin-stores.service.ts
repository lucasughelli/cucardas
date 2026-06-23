import type { Prisma, StoreStatus } from "@prisma/client";
import { TiendanubeApiClient } from "../../lib/tiendanubeClient";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { invalidateProductsCache } from "../products/products.service";
import { buildAuthorizeUrl } from "../auth/tiendanube.service";
import { getDecryptedAccessToken } from "../stores/stores.service";

export interface ListStoresParams {
  q?: string;
  status?: StoreStatus;
}

export async function listStoresAdmin(params: ListStoresParams) {
  const where: Prisma.StoreWhereInput = {
    status: params.status,
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { email: { contains: params.q, mode: "insensitive" } },
            { tnStoreId: { contains: params.q } },
          ],
        }
      : {}),
  };

  return prisma.store.findMany({
    where,
    orderBy: { installedAt: "desc" },
    include: { _count: { select: { designs: true, assignments: true } } },
  });
}

export async function getStoreAdmin(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { _count: { select: { designs: true, assignments: true, errorLogs: true } } },
  });
  if (!store) throw new HttpError(404, "Tienda no encontrada");
  return store;
}

export async function suspendStore(storeId: string) {
  await getStoreAdmin(storeId);
  return prisma.store.update({ where: { id: storeId }, data: { status: "SUSPENDED" } });
}

export async function reactivateStore(storeId: string) {
  await getStoreAdmin(storeId);
  return prisma.store.update({ where: { id: storeId }, data: { status: "ACTIVE", uninstalledAt: null } });
}

/**
 * Tiendanube no expone un mecanismo de refresh token: la única forma real de "resetear"
 * el acceso es que el merchant vuelva a autorizar la app. Esto fuerza el estado a
 * "requiere reconexión" y devuelve el link para reinstalar.
 */
export async function resetStoreToken(storeId: string) {
  const store = await suspendStore(storeId);
  return { store, reconnectUrl: buildAuthorizeUrl() };
}

export async function forceResync(storeId: string) {
  const store = await getStoreAdmin(storeId);
  invalidateProductsCache(storeId);

  try {
    const client = new TiendanubeApiClient(getDecryptedAccessToken(store), store.tnStoreId);
    await client.get("/store");
  } catch {
    // El detalle del fallo de conectividad ya queda registrado por quien hizo la llamada original.
  }

  return prisma.store.update({ where: { id: storeId }, data: { lastSyncAt: new Date() } });
}
