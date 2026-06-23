import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireStoreAuth } from "../../middleware/auth";
import { getDashboardSummary } from "./dashboard.service";

export const dashboardRouter = Router();
dashboardRouter.use(requireStoreAuth);

dashboardRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await getDashboardSummary(req.store!.storeId);
    res.json(summary);
  }),
);
