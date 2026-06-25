import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireStoreAuth } from "../../middleware/auth";
import { HttpError } from "../../middleware/errorHandler";
import {
  changeStoreUserPassword,
  createStoreUser,
  deleteStoreUser,
  listStoreUsers,
} from "./team.service";

export const teamRouter = Router();
teamRouter.use(requireStoreAuth);

const createSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  name: z.string().trim().max(80).optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("EDITOR"),
});

teamRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await listStoreUsers(req.store!.storeId);
    res.json({ users, currentTeamUserId: req.store!.teamUserId ?? null });
  }),
);

teamRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const user = await createStoreUser(req.store!.storeId, input);
    res.status(201).json(user);
  }),
);

teamRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    // No permitir que una cuenta de equipo se borre a sí misma (evita quedarse sin sesión).
    if (req.store!.teamUserId === req.params.id) {
      throw new HttpError(400, "No podés eliminar tu propia cuenta mientras estás logueado con ella");
    }
    await deleteStoreUser(req.store!.storeId, req.params.id);
    res.status(204).send();
  }),
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").max(100),
});

teamRouter.post(
  "/change-password",
  asyncHandler(async (req, res) => {
    const teamUserId = req.store!.teamUserId;
    if (!teamUserId) {
      throw new HttpError(
        400,
        "Iniciaste sesión con tu cuenta de Tiendanube; la contraseña se gestiona allá. El cambio de contraseña aplica a las cuentas de equipo.",
      );
    }
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changeStoreUserPassword(teamUserId, currentPassword, newPassword);
    res.json({ ok: true });
  }),
);
