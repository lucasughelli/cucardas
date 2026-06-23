import type { Store } from "@prisma/client";
import { decryptSecret, encryptSecret } from "../../lib/crypto";
import { prisma } from "../../lib/prisma";
import { TiendanubeApiClient } from "../../lib/tiendanubeClient";
import { HttpError } from "../../middleware/errorHandler";

export async function upsertStoreFromOAuth(params: {
  tnStoreId: string;
  accessToken: string;
  scope: string;
  name?: string;
  email?: string;
}): Promise<Store> {
  const accessTokenEnc = encryptSecret(params.accessToken);

  return prisma.store.upsert({
    where: { tnStoreId: params.tnStoreId },
    create: {
      tnStoreId: params.tnStoreId,
      name: params.name,
      email: params.email,
      accessTokenEnc,
      scope: params.scope,
      status: "ACTIVE",
    },
    update: {
      name: params.name,
      email: params.email,
      accessTokenEnc,
      scope: params.scope,
      status: "ACTIVE",
      uninstalledAt: null,
    },
  });
}

export function getDecryptedAccessToken(store: Store): string {
  return decryptSecret(store.accessTokenEnc);
}

export async function findActiveStoreById(storeId: string): Promise<Store | null> {
  return prisma.store.findFirst({ where: { id: storeId, status: "ACTIVE" } });
}

export async function findStoreByTnId(tnStoreId: string): Promise<Store | null> {
  return prisma.store.findUnique({ where: { tnStoreId } });
}

export async function markStoreUninstalled(tnStoreId: string): Promise<void> {
  await prisma.store.updateMany({
    where: { tnStoreId },
    data: { status: "SUSPENDED", uninstalledAt: new Date() },
  });
}

/**
 * Billing gestionado por Tiendanube: cuando el comercio no paga, Tiendanube suspende el acceso
 * (webhook app/suspended). Dejamos uninstalledAt en null a propósito para distinguirlo de una
 * desinstalación: así el cron de purga NO borra una tienda solo suspendida por pago, y al pagar
 * (app/resumed) se reactiva sin perder datos.
 */
export async function markStorePaymentSuspended(tnStoreId: string): Promise<void> {
  await prisma.store.updateMany({
    where: { tnStoreId, uninstalledAt: null },
    data: { status: "SUSPENDED" },
  });
}

/** Tiendanube reanuda el acceso tras regularizar el pago (webhook app/resumed). */
export async function markStoreResumed(tnStoreId: string): Promise<void> {
  await prisma.store.updateMany({
    where: { tnStoreId, uninstalledAt: null },
    data: { status: "ACTIVE" },
  });
}

/**
 * Borrado definitivo de los datos de una tienda. Se usa para el webhook obligatorio store/redact
 * (solicitud de eliminación de datos del comercio, LGPD). Las relaciones tienen onDelete: Cascade,
 * así que borrar la fila Store arrastra cucardas, asignaciones y auditoría.
 */
export async function deleteStoreData(tnStoreId: string): Promise<void> {
  await prisma.store.deleteMany({ where: { tnStoreId } });
}

/** Helper compartido: resuelve la tienda activa y devuelve un cliente de API ya autenticado. */
export async function getClientForStore(
  storeId: string,
): Promise<{ store: Store; client: TiendanubeApiClient }> {
  const store = await findActiveStoreById(storeId);
  if (!store) {
    throw new HttpError(404, "Tienda no encontrada o suspendida");
  }
  const accessToken = getDecryptedAccessToken(store);
  return { store, client: new TiendanubeApiClient(accessToken, store.tnStoreId) };
}
