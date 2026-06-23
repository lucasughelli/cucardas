import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { adminRouter } from "./modules/admin/admin.routes";
import { assignmentsRouter } from "./modules/assignments/assignments.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { designsRouter } from "./modules/designs/designs.routes";
import { errorsRouter } from "./modules/errors/errors.routes";
import { productsRouter } from "./modules/products/products.routes";
import { webhooksRouter } from "./modules/webhooks/webhooks.routes";
import { publicApiRouter, widgetRouter } from "./modules/widget/widget.routes";

export function createApp() {
  const app = express();

  // Detrás de un reverse proxy / CDN en producción (Railway, Render, Cloudflare): necesario
  // para que express-rate-limit y los logs vean la IP real del cliente vía X-Forwarded-For.
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Cabeceras de seguridad. crossOriginResourcePolicy en "cross-origin" porque el widget JS y
  // los assets se sirven a los storefronts de las tiendas (otros dominios).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // el panel (SPA) se sirve aparte; no aplicamos CSP acá
    }),
  );

  // CORS restringido al panel propio para las rutas autenticadas. Aceptamos una lista de orígenes:
  // el FRONTEND_URL configurado (producción / túnel) más localhost para desarrollo, así el panel
  // funciona tanto servido en su dominio real como abierto en localhost sin tener que tocar el .env.
  // El widget público (storefront de cada tienda, dominio impredecible) usa su propio CORS más abajo.
  const allowedOrigins = [
    env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  const appCors = cors({
    origin(origin, callback) {
      // Sin Origin (curl, server-to-server) o en la lista permitida → OK.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  });

  app.use(
    express.json({
      limit: "5mb",
      // Necesario para poder validar el HMAC de los webhooks de Tiendanube sobre el body crudo.
      // Firma de body-parser: (req, res, buf, encoding) — no (req, buf).
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/auth", appCors, authRouter);
  app.use("/api/products", appCors, productsRouter);
  app.use("/api/designs", appCors, designsRouter);
  app.use("/api/assignments", appCors, assignmentsRouter);
  app.use("/api/errors", appCors, errorsRouter);
  app.use("/api/admin", appCors, adminRouter);
  app.use("/api/dashboard", appCors, dashboardRouter);

  app.use("/widget", widgetRouter);
  app.use("/api/public", cors(), publicApiRouter);

  // Llamado servidor-a-servidor por Tiendanube: no necesita (ni debe depender de) CORS.
  app.use("/webhooks", webhooksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
