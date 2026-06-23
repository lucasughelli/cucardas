import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * Purga definitiva de datos de tiendas que desinstalaron la app hace más de PURGE_GRACE_DAYS.
 *
 * Política de datos (ver publishing/DATA-HANDLING.md):
 *  - Al desinstalar, la tienda se marca SUSPENDED + uninstalledAt (webhook app/uninstalled).
 *  - Se conserva un período de gracia (default 90 días) por si la tienda reinstala.
 *  - Pasado ese período, se borran definitivamente sus datos.
 *
 * Las relaciones (Design, DesignVersion, Assignment, AuditLog) tienen onDelete: Cascade,
 * así que basta con borrar la fila Store. ErrorLog usa SetNull (logs anonimizados se conservan).
 *
 * Correr periódicamente (cron diario):  npx tsx prisma/purge-uninstalled.ts
 */
const prisma = new PrismaClient();

async function main() {
  const graceDays = Number(process.env.PURGE_GRACE_DAYS ?? 90);
  const cutoff = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000);

  const toPurge = await prisma.store.findMany({
    where: { status: "SUSPENDED", uninstalledAt: { lt: cutoff } },
    select: { id: true, tnStoreId: true, uninstalledAt: true },
  });

  if (toPurge.length === 0) {
    console.log(`No hay tiendas para purgar (gracia: ${graceDays} días).`);
    return;
  }

  for (const store of toPurge) {
    await prisma.store.delete({ where: { id: store.id } });
    console.log(`Purgada tienda ${store.tnStoreId} (desinstalada el ${store.uninstalledAt?.toISOString()}).`);
  }

  console.log(`Total purgadas: ${toPurge.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
