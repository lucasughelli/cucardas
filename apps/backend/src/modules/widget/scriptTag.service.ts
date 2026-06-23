import type { Store } from "@prisma/client";
import axios from "axios";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { TiendanubeApiClient } from "../../lib/tiendanubeClient";
import { getDecryptedAccessToken } from "../stores/stores.service";

/**
 * A diferencia de Shopify, Tiendanube no tiene un endpoint para crear scripts dinámicamente:
 * el Script (con su src/event) se crea una sola vez a mano en partners.tiendanube.com y queda
 * identificado por TN_SCRIPT_ID. Esta función solo activa ("asocia") ese script ya existente
 * para una tienda puntual, pasándole el store_id como query param para que el widget sepa para
 * qué tienda corre — ver tiendanube.github.io/api-documentation/resources/script.
 *
 * La API no devuelve un ID de instancia separado: la asociación queda identificada por el
 * mismo script_id (ver GET /scripts), así que guardamos TN_SCRIPT_ID directamente.
 */
export async function ensureScriptTagRegistered(store: Store): Promise<void> {
  if (store.scriptTagId) return;

  if (!env.TN_SCRIPT_ID) {
    logger.warn(
      { storeId: store.id },
      "TN_SCRIPT_ID no está configurado: creá el Script una vez en partners.tiendanube.com y poné su ID en .env",
    );
    return;
  }

  const client = new TiendanubeApiClient(getDecryptedAccessToken(store), store.tnStoreId);

  try {
    await client.post("/scripts", {
      script_id: Number(env.TN_SCRIPT_ID),
      // La API exige que query_params sea un string JSON, no un objeto (devuelve 400 si no).
      // api_base viaja porque Tiendanube hostea el archivo en su propio dominio: el widget no
      // puede derivar la URL de nuestra API a partir de su propio src.
      query_params: JSON.stringify({ store_id: store.tnStoreId, api_base: env.APP_BASE_URL }),
    });
    await prisma.store.update({ where: { id: store.id }, data: { scriptTagId: env.TN_SCRIPT_ID } });
  } catch (err) {
    // 409: ya estaba asociado a esta tienda (ej. reintentos) — lo tratamos como éxito.
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      await prisma.store.update({ where: { id: store.id }, data: { scriptTagId: env.TN_SCRIPT_ID } });
      return;
    }
    logger.error({ err, storeId: store.id }, "No se pudo activar el script de Tiendanube para esta tienda");
  }
}

/** Best-effort: si la tienda desinstala la app, intentamos desactivar el script. */
export async function removeScriptTag(store: Store): Promise<void> {
  if (!store.scriptTagId) return;
  try {
    const client = new TiendanubeApiClient(getDecryptedAccessToken(store), store.tnStoreId);
    await client.delete(`/scripts/${store.scriptTagId}`);
  } catch (err) {
    logger.warn({ err, storeId: store.id }, "No se pudo desactivar el script (puede que el token ya esté revocado)");
  }
}
