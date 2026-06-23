import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { loginAdmin } from "./admin-auth.service";
import { getOverviewAnalytics } from "./admin-analytics.service";
import { exportErrorsCsv, getErrorDetail, groupErrorsByPattern, listErrors } from "./admin-errors.service";
import {
  forceResync,
  getStoreAdmin,
  listStoresAdmin,
  reactivateStore,
  resetStoreToken,
  suspendStore,
} from "./admin-stores.service";

export const adminRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

adminRouter.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginAdmin(email, password);
    res.json(result);
  }),
);

adminRouter.use(requireAdminAuth());

const listStoresSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

adminRouter.get(
  "/stores",
  asyncHandler(async (req, res) => {
    const query = listStoresSchema.parse(req.query);
    const stores = await listStoresAdmin(query);
    res.json({ stores });
  }),
);

adminRouter.get(
  "/stores/:id",
  asyncHandler(async (req, res) => {
    const store = await getStoreAdmin(req.params.id);
    res.json(store);
  }),
);

adminRouter.post(
  "/stores/:id/suspend",
  asyncHandler(async (req, res) => {
    const store = await suspendStore(req.params.id);
    res.json(store);
  }),
);

adminRouter.post(
  "/stores/:id/reactivate",
  asyncHandler(async (req, res) => {
    const store = await reactivateStore(req.params.id);
    res.json(store);
  }),
);

adminRouter.post(
  "/stores/:id/reset-token",
  asyncHandler(async (req, res) => {
    const result = await resetStoreToken(req.params.id);
    res.json(result);
  }),
);

adminRouter.post(
  "/stores/:id/resync",
  asyncHandler(async (req, res) => {
    const store = await forceResync(req.params.id);
    res.json(store);
  }),
);

const listErrorsSchema = z.object({
  q: z.string().trim().optional(),
  level: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  source: z.enum(["FRONTEND", "BACKEND", "API"]).optional(),
  storeId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});

adminRouter.get(
  "/errors",
  asyncHandler(async (req, res) => {
    const filter = listErrorsSchema.parse(req.query);
    const result = await listErrors(filter);
    res.json(result);
  }),
);

adminRouter.get(
  "/errors/grouped",
  asyncHandler(async (_req, res) => {
    const groups = await groupErrorsByPattern();
    res.json({ groups });
  }),
);

adminRouter.get(
  "/errors/export",
  asyncHandler(async (req, res) => {
    const filter = listErrorsSchema.omit({ page: true, perPage: true }).parse(req.query);
    const csv = await exportErrorsCsv(filter);
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", "attachment; filename=errores.csv");
    res.send(csv);
  }),
);

adminRouter.get(
  "/errors/:id",
  asyncHandler(async (req, res) => {
    const error = await getErrorDetail(req.params.id);
    res.json(error);
  }),
);

adminRouter.get(
  "/analytics/overview",
  asyncHandler(async (_req, res) => {
    const overview = await getOverviewAnalytics();
    res.json(overview);
  }),
);
