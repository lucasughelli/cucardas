import { signToken } from "../../lib/jwt";
import { comparePassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export async function loginAdmin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, "Credenciales inválidas");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Credenciales inválidas");

  const token = signToken({ kind: "user", userId: user.id, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}
