import type { StoreUserRole } from "@prisma/client";
import { signToken } from "../../lib/jwt";
import { comparePassword, hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export interface PublicStoreUser {
  id: string;
  email: string;
  name: string | null;
  role: StoreUserRole;
  createdAt: Date;
}

function toPublic(u: {
  id: string;
  email: string;
  name: string | null;
  role: StoreUserRole;
  createdAt: Date;
}): PublicStoreUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt };
}

export async function listStoreUsers(storeId: string): Promise<PublicStoreUser[]> {
  const users = await prisma.storeUser.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return users.map(toPublic);
}

export async function createStoreUser(
  storeId: string,
  input: { email: string; name?: string; password: string; role: StoreUserRole },
): Promise<PublicStoreUser> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.storeUser.findUnique({
    where: { storeId_email: { storeId, email } },
  });
  if (existing) throw new HttpError(409, "Ya existe una cuenta con ese email en esta tienda");

  const user = await prisma.storeUser.create({
    data: {
      storeId,
      email,
      name: input.name?.trim() || null,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return toPublic(user);
}

export async function deleteStoreUser(storeId: string, userId: string): Promise<void> {
  const user = await prisma.storeUser.findFirst({ where: { id: userId, storeId } });
  if (!user) throw new HttpError(404, "Cuenta no encontrada");
  await prisma.storeUser.delete({ where: { id: userId } });
}

/** Login de una cuenta de equipo: devuelve un token de sesión scoped a su tienda. */
export async function loginStoreUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.storeUser.findFirst({
    where: { email: normalized },
    include: { store: true },
  });
  if (!user) throw new HttpError(401, "Email o contraseña incorrectos");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Email o contraseña incorrectos");

  if (user.store.status !== "ACTIVE") {
    throw new HttpError(403, "La tienda está suspendida o desinstalada");
  }

  const token = signToken({
    kind: "store",
    storeId: user.storeId,
    tnStoreId: user.store.tnStoreId,
    teamUserId: user.id,
  });
  return {
    token,
    tnStoreId: user.store.tnStoreId,
    user: toPublic(user),
  };
}

/** Cambio de contraseña de la cuenta de equipo actualmente logueada. */
export async function changeStoreUserPassword(
  teamUserId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.storeUser.findUnique({ where: { id: teamUserId } });
  if (!user) throw new HttpError(404, "Cuenta no encontrada");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new HttpError(400, "La contraseña actual es incorrecta");

  await prisma.storeUser.update({
    where: { id: teamUserId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}
