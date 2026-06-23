import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireStoreAuth } from "../../middleware/auth";
import { getProduct, listProducts } from "./products.service";

export const productsRouter = Router();
productsRouter.use(requireStoreAuth);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().min(1).optional(),
});

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const result = await listProducts(req.store!.storeId, query);
    res.json(result);
  }),
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await getProduct(req.store!.storeId, req.params.id);
    res.json(product);
  }),
);
