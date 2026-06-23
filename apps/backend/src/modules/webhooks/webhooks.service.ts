import type { Store } from "@prisma/client";
import axios from "axios";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { TiendanubeApiClient } from "../../lib/tiendanubeClient";
import { getDecryptedAccessToken } from "../stores/stores.service";

/**
 * Eventos de webhook que la app necesita recibir de Tiendanube. Se registran en la instalación.
 *
 * - app/uninstalled: REQUERIDO por la revisión. Sin esto la app no se entera de la desinstalación.
 * - app/suspended, app/resumed: billing gestionado por Tiendanube. Cuando el comercio no paga,
 *   Tiendanube suspende el acceso (y deja de servir Scripts y de llamar webhooks); estos eventos
 *   nos permiten reflejar el estado de suscripción en nuestra DB/UI.
 * - store/redact, customers/redact, customers/data_request: webhooks OBLIGATORIOS de LGPD para
 *   apps públicas. Aunque no almacenamos datos de compradores (los de customers son no-ops que
 *   solo confirmamos), Tiendanube exige estar suscrito a los tres.
 * - product/*: para invalidar la cache de productos cuando cambian en la tienda.
 *
 * Doc: https://tiendanube.github.io/api-documentation/resources/webhook
 */
const REQUIRED_WEBHOOK_EVENTS = [
  "app/uninstalled",
  "app/suspended",
  "app/resumed",
  "store/redact",
  "customers/redact",
  "customers/data_request",
  "product/created",
  "product/updated",
  "product/deleted",
] as const;

interface TiendanubeWebhook {
  id: number;
  event: string;
  url: string;
}

/**
 * Registra (de forma idempotente) los webhooks que la app necesita para la tienda recién instalada.
 * Best-effort: si falla un registro puntual se loguea pero no se interrumpe el flujo de OAuth,
 * porque la app sigue siendo usable y el registro se reintenta en el próximo login/callback.
 */
export async function ensureWebhooksRegistered(store: Store): Promise<void> {
  const client = new TiendanubeApiClient(getDecryptedAccessToken(store), store.tnStoreId);
  const targetUrl = `${env.APP_BASE_URL}/webhooks/tiendanube`;

  let existing: TiendanubeWebhook[] = [];
  try {
    existing = await client.get<TiendanubeWebhook[]>("/webhooks");
  } catch (err) {
    logger.warn({ err, storeId: store.id }, "No se pudieron listar webhooks existentes; se intentará crear igual");
  }

  for (const event of REQUIRED_WEBHOOK_EVENTS) {
    const already = existing.find((w) => w.event === event && w.url === targetUrl);
    if (already) continue;

    try {
      await client.post("/webhooks", { event, url: targetUrl });
    } catch (err) {
      // 422: típicamente ya existe un webhook para ese evento/url — lo tratamos como éxito.
      if (axios.isAxiosError(err) && err.response?.status === 422) continue;
      logger.error({ err, storeId: store.id, event }, "No se pudo registrar webhook de Tiendanube");
    }
  }
}
