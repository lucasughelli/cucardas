import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireStoreAuth } from "../../middleware/auth";
import { getDesignAnalytics, getStoreAnalytics } from "./analytics.service";

export const analyticsRouter = Router();
analyticsRouter.use(requireStoreAuth);

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

function defaultDateRange(input: unknown) {
  const parsed = dateRangeSchema.parse(input);
  const endDate = parsed.endDate ? new Date(parsed.endDate) : new Date();
  const startDate = parsed.startDate
    ? new Date(parsed.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  return { startDate, endDate };
}

/** Analytics de toda la tienda (últimos 30 días por defecto). */
analyticsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = defaultDateRange(req.query);
    const analytics = await getStoreAnalytics(req.store!.storeId, startDate, endDate);
    res.json({ analytics, period: { startDate, endDate } });
  }),
);

/** Analytics de un diseño específico. */
analyticsRouter.get(
  "/designs/:designId",
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = defaultDateRange(req.query);
    const summary = await getDesignAnalytics(
      req.store!.storeId,
      req.params.designId,
      startDate,
      endDate,
    );
    res.json({ summary, period: { startDate, endDate } });
  }),
);
