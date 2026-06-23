import { Router } from "express";
import { env } from "../../config/env";
import { asyncHandler } from "../../lib/asyncHandler";
import { logger } from "../../lib/logger";
import { signToken } from "../../lib/jwt";
import { upsertStoreFromOAuth } from "../stores/stores.service";
import { ensureWebhooksRegistered } from "../webhooks/webhooks.service";
import { ensureScriptTagRegistered } from "../widget/scriptTag.service";
import { buildAuthorizeUrl, exchangeCodeForToken, extractStoreName, fetchStoreInfo } from "./tiendanube.service";

export const authRouter = Router();

/** Punto de entrada propio: redirige a la pantalla de autorización de Tiendanube. */
authRouter.get("/tiendanube/install", (_req, res) => {
  res.redirect(buildAuthorizeUrl());
});

/** Tiendanube redirige acá con ?code=... luego de que el merchant autoriza la app. */
authRouter.get(
  "/tiendanube/callback",
  asyncHandler(async (req, res) => {
    const code = req.query.code;
    if (typeof code !== "string" || !code) {
      return res.redirect(`${env.FRONTEND_URL}/auth/error?reason=missing_code`);
    }

    const tokenResponse = await exchangeCodeForToken(code);
    const tnStoreId = String(tokenResponse.user_id);

    let name: string | undefined;
    let email: string | undefined;
    try {
      const storeInfo = await fetchStoreInfo(tokenResponse.access_token, tnStoreId);
      name = extractStoreName(storeInfo);
      email = storeInfo.email;
    } catch (err) {
      logger.warn({ err, tnStoreId }, "No se pudo obtener info de la tienda luego del OAuth");
    }

    const store = await upsertStoreFromOAuth({
      tnStoreId,
      accessToken: tokenResponse.access_token,
      scope: tokenResponse.scope,
      name,
      email,
    });

    await ensureScriptTagRegistered(store);
    await ensureWebhooksRegistered(store);

    const token = signToken({ kind: "store", storeId: store.id, tnStoreId: store.tnStoreId });

    res.redirect(`${env.FRONTEND_URL}/?token=${encodeURIComponent(token)}&store_id=${store.tnStoreId}`);
  }),
);
