import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === "production";

  // En producción NUNCA usamos credenciales por defecto: exigimos que se provean explícitamente.
  if (isProduction && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
    throw new Error(
      "En producción debés definir SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD antes de correr el seed.",
    );
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@cucardas.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`El usuario admin ${email} ya existe, no se modifica nada.`);
    return;
  }

  await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), role: "ADMIN" },
  });

  console.log(`Usuario admin creado: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Contraseña por defecto: ${password} — cambiala después de loguearte.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
