import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { asyncHandler } from "../../lib/asyncHandler";
import { logger } from "../../lib/logger";
import { invalidateProductsCache } from "../products/products.service";
import {
  deleteStoreData,
  findStoreByTnId,
  markStorePaymentSuspended,
  markStoreResumed,
  markStoreUninstalled,
} from "../stores/stores.service";
import { removeScriptTag } from "../widget/scriptTag.service";

export const webhooksRouter = Router();

/**
 * Nombre del header de firma según la documentación pública de Tiendanube al momento de
 * implementar esto. Si Tiendanube lo renombró, este es el único lugar a ajustar.
 */
const SIGNATURE_HEADER = "x-linkedstore-hmac-sha256";

function hasValidSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): boolean {
  if (!rawBody || !signatureHeader) return false;

  const expected = crypto.createHmac("sha256", env.TN_CLIENT_SECRET).update(rawBody).digest("base64");
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

const webhookBodySchema = z.object({
  store_id: z.union([z.string(), z.number()]).transform(String),
  event: z.string(),
});

webhooksRouter.post(
  "/tiendanube",
  asyncHandler(async (req, res) => {
    const signature = req.header(SIGNATURE_HEADER);
    if (!hasValidSignature(req.rawBody, signature)) {
      logger.warn({ path: req.path }, "Webhook de Tiendanube con firma inválida o ausente, rechazado");
      return res.status(401).json({ error: "Firma inválida" });
    }

    const { store_id: tnStoreId, event } = webhookBodySchema.parse(req.body);

    switch (event) {
      case "app/uninstalled": {
        const store = await findStoreByTnId(tnStoreId);
        if (store) await removeScriptTag(store);
        await markStoreUninstalled(tnStoreId);
        break;
      }
      // Billing gestionado por Tiendanube: suspensión/reanudación por estado de pago.
      case "app/suspended": {
        await markStorePaymentSuspended(tnStoreId);
        logger.info({ tnStoreId }, "App suspendida por Tiendanube (estado de pago)");
        break;
      }
      case "app/resumed": {
        await markStoreResumed(tnStoreId);
        logger.info({ tnStoreId }, "App reanudada por Tiendanube (pago regularizado)");
        break;
      }
      // LGPD obligatorios.
      case "store/redact": {
        // Solicitud de eliminación de datos del comercio: borrado definitivo.
        await deleteStoreData(tnStoreId);
        logger.info({ tnStoreId }, "store/redact: datos de la tienda eliminados");
        break;
      }
      case "customers/redact":
      case "customers/data_request": {
        // No almacenamos datos personales de compradores: no hay nada que borrar ni que entregar.
        // Igual debemos estar suscritos y confirmar la recepción (200).
        logger.info({ event, tnStoreId }, "Webhook LGPD de customers recibido (sin datos que procesar)");
        break;
      }
      case "product/updated":
      case "product/created":
      case "product/deleted": {
        const store = await findStoreByTnId(tnStoreId);
        if (store) invalidateProductsCache(store.id);
        break;
      }
      default:
        logger.info({ event, tnStoreId }, "Webhook de Tiendanube recibido sin handler específico");
    }

    // Tiendanube espera un 200 rápido; nuestro procesamiento es liviano y síncrono.
    res.status(200).json({ received: true });
  }),
);
