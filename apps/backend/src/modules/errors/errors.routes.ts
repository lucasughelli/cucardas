import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { persistErrorLog } from "../../lib/errorLog";
import { requireStoreAuth } from "../../middleware/auth";

export const errorsRouter = Router();
errorsRouter.use(requireStoreAuth);

const reportSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

/** Permite que el frontend reporte errores propios (ej. excepciones de React) al monitor central. */
errorsRouter.post(
  "/report",
  asyncHandler(async (req, res) => {
    const input = reportSchema.parse(req.body);
    await persistErrorLog({
      storeId: req.store!.storeId,
      source: "FRONTEND",
      message: input.message,
      stack: input.stack,
      context: input.context,
    });
    res.status(201).json({ received: true });
  }),
);
