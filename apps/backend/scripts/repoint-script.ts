import "dotenv/config";
import { env } from "../src/config/env";
import { prisma } from "../src/lib/prisma";
import { TiendanubeApiClient } from "../src/lib/tiendanubeClient";
import { getDecryptedAccessToken } from "../src/modules/stores/stores.service";

/**
 * Re-apunta el Script de Tiendanube de cada tienda activa al APP_BASE_URL actual del .env.
 *
 * Para qué sirve: el widget en el storefront lee la API desde el `api_base` que quedó "horneado"
 * en la asociación del Script al instalar. Si el backend cambia de URL (típico al reiniciar un túnel
 * de Cloudflare/ngrok efímero), ese api_base queda muerto y el widget deja de traer las cucardas.
 * Este script borra la asociación vieja y la recrea con el api_base nuevo.
 *
 *   npx tsx scripts/repoint-script.ts
 */
async function main() {
  if (!env.TN_SCRIPT_ID) throw new Error("Falta TN_SCRIPT_ID en .env");

  const stores = await prisma.store.findMany({ where: { status: "ACTIVE" } });
  if (stores.length === 0) {
    console.log("No hay tiendas activas.");
    return;
  }

  console.log(`Re-apuntando ${stores.length} tienda(s) a api_base = ${env.APP_BASE_URL}\n`);

  for (const store of stores) {
    const client = new TiendanubeApiClient(getDecryptedAccessToken(store), store.tnStoreId);
    const queryParams = JSON.stringify({ store_id: store.tnStoreId, api_base: env.APP_BASE_URL });

    // Borrar asociación previa (si existe). Ignoramos errores: puede no existir.
    try {
      await client.delete(`/scripts/${env.TN_SCRIPT_ID}`);
    } catch {
      /* no estaba asociado, seguimos */
    }

    // Recrear con el api_base nuevo.
    try {
      await client.post("/scripts", { script_id: Number(env.TN_SCRIPT_ID), query_params: queryParams });
      await prisma.store.update({ where: { id: store.id }, data: { scriptTagId: env.TN_SCRIPT_ID } });
      console.log(`  ✓ ${store.tnStoreId} (${store.name ?? "sin nombre"}) re-apuntada`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${store.tnStoreId}: ${msg}`);
    }
  }

  console.log("\nListo. Pedile al comercio que recargue la página de producto (Ctrl+F5).");
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
