import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { getPublicAssignments, getPublicAssignmentsBatch } from "../assignments/assignments.service";

export const widgetRouter = Router();

const widgetScript = fs.readFileSync(path.join(__dirname, "cucardas-widget.client.js"), "utf8");

widgetRouter.get("/cucardas.js", (_req, res) => {
  res.set("Content-Type", "application/javascript; charset=utf-8");
  res.set("Cache-Control", "public, max-age=300");
  res.send(widgetScript);
});

export const publicApiRouter = Router();

const publicRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const publicAssignmentsQuerySchema = z.object({
  store_id: z.string().min(1),
  product_id: z.string().min(1),
});

publicApiRouter.get(
  "/assignments",
  publicRateLimit,
  asyncHandler(async (req, res) => {
    const { store_id, product_id } = publicAssignmentsQuerySchema.parse(req.query);
    const assignments = await getPublicAssignments(store_id, product_id);
    res.set("Cache-Control", "public, max-age=60");
    res.json({ assignments });
  }),
);

const batchQuerySchema = z.object({
  store_id: z.string().min(1),
  // Lista de IDs de producto separados por coma (para páginas de grilla/listado).
  product_ids: z.string().min(1),
});

publicApiRouter.get(
  "/assignments/batch",
  publicRateLimit,
  asyncHandler(async (req, res) => {
    const { store_id, product_ids } = batchQuerySchema.parse(req.query);
    const ids = product_ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
    const assignments = await getPublicAssignmentsBatch(store_id, ids);
    res.set("Cache-Control", "public, max-age=60");
    res.json({ assignments });
  }),
);
