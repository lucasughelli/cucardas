import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireStoreAuth } from "../../middleware/auth";
import {
  createAssignments,
  deleteAssignment,
  listAssignments,
  removeAssignmentsForProducts,
  setAssignmentActive,
} from "./assignments.service";

export const assignmentsRouter = Router();
assignmentsRouter.use(requireStoreAuth);

const createSchema = z.object({
  designId: z.string().uuid(),
  productIds: z.array(z.string().min(1)).min(1).max(200),
});

assignmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
    const assignments = await listAssignments(req.store!.storeId, productId);
    res.json({ assignments });
  }),
);

assignmentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const assignments = await createAssignments(req.store!.storeId, input);
    res.status(201).json({ assignments });
  }),
);

assignmentsRouter.post(
  "/bulk-remove",
  asyncHandler(async (req, res) => {
    const { productIds } = z
      .object({ productIds: z.array(z.string().min(1)).min(1).max(200) })
      .parse(req.body);
    const count = await removeAssignmentsForProducts(req.store!.storeId, productIds);
    res.json({ removed: count });
  }),
);

assignmentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const assignment = await setAssignmentActive(req.store!.storeId, req.params.id, active);
    res.json(assignment);
  }),
);

assignmentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteAssignment(req.store!.storeId, req.params.id);
    res.status(204).send();
  }),
);
