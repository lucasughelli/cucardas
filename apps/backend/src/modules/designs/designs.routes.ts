import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { uploadObject } from "../../lib/s3";
import { requireStoreAuth } from "../../middleware/auth";
import { HttpError } from "../../middleware/errorHandler";
import { imageUpload } from "../../middleware/upload";
import {
  createDesign,
  deleteDesign,
  duplicateDesign,
  getDesign,
  listDesigns,
  listVersions,
  restoreVersion,
  setDesignActive,
  updateDesign,
} from "./designs.service";

export const designsRouter = Router();
designsRouter.use(requireStoreAuth);

const canvasJsonSchema = z.record(z.string(), z.unknown());

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Color hex inválido");

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().max(60).optional(),
    type: z.enum(["IMAGE", "TEXT"]),
    active: z.boolean().optional(),
    // texto
    text: z.string().trim().max(60).optional(),
    textColor: hexColor.optional(),
    backgroundColor: hexColor.optional(),
    // imagen
    canvasJson: canvasJsonSchema.optional(),
    thumbnailDataUrl: z.string().optional(),
    // display
    location: z.enum(["PRODUCT_PAGE", "PRODUCT_GRID", "BOTH"]).optional(),
    position: z.enum(["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT", "CENTER"]).optional(),
    animation: z.enum(["NONE", "PULSE", "BLINK", "BOUNCE", "SHAKE"]).optional(),
    size: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
    sizePx: z.number().int().min(16).max(400).nullable().optional(),
    condition: z.enum(["NONE", "ON_SALE", "OUT_OF_STOCK", "IN_STOCK", "NEW"]).optional(),
    hideNativeBadges: z.boolean().optional(),
  })
  .refine((data) => data.type !== "TEXT" || (data.text && data.text.trim().length > 0), {
    message: "Las cucardas de texto requieren un texto",
    path: ["text"],
  });

const updateSchema = createSchema.innerType().partial();

const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  type: z.enum(["IMAGE", "TEXT"]).optional(),
  active: z.coerce.boolean().optional(),
});

designsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const designs = await listDesigns(req.store!.storeId, query);
    res.json({ designs });
  }),
);

designsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const design = await getDesign(req.store!.storeId, req.params.id);
    res.json(design);
  }),
);

designsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const design = await createDesign(req.store!.storeId, input);
    res.status(201).json(design);
  }),
);

designsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const design = await updateDesign(req.store!.storeId, req.params.id, input);
    res.json(design);
  }),
);

designsRouter.patch(
  "/:id/active",
  asyncHandler(async (req, res) => {
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const design = await setDesignActive(req.store!.storeId, req.params.id, active);
    res.json(design);
  }),
);

designsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteDesign(req.store!.storeId, req.params.id);
    res.status(204).send();
  }),
);

designsRouter.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) => {
    const { name } = z.object({ name: z.string().trim().min(1).max(120).optional() }).parse(req.body ?? {});
    const design = await duplicateDesign(req.store!.storeId, req.params.id, name);
    res.status(201).json(design);
  }),
);

designsRouter.get(
  "/:id/versions",
  asyncHandler(async (req, res) => {
    const versions = await listVersions(req.store!.storeId, req.params.id);
    res.json({ versions });
  }),
);

designsRouter.post(
  "/:id/versions/:versionId/restore",
  asyncHandler(async (req, res) => {
    const design = await restoreVersion(req.store!.storeId, req.params.id, req.params.versionId);
    res.json(design);
  }),
);

/** Subida de imágenes personalizadas para usar dentro del editor (no son el diseño en sí). */
designsRouter.post(
  "/assets",
  imageUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Falta el archivo a subir");
    const extension = req.file.mimetype.split("/")[1].replace("svg+xml", "svg");
    const key = `assets/${req.store!.storeId}/${randomUUID()}.${extension}`;
    const url = await uploadObject(key, req.file.buffer, req.file.mimetype);
    res.status(201).json({ url });
  }),
);
