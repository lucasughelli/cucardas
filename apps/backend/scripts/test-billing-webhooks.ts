import "dotenv/config";
import crypto from "node:crypto";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

/**
 * Prueba local de los webhooks de billing/LGPD SIN Tiendanube real.
 * Firma el HMAC igual que lo hace Tiendanube (con TN_CLIENT_SECRET) y postea al backend local.
 * Usa una tienda de prueba descartable: NUNCA toca tiendas reales.
 *
 *   npx tsx scripts/test-billing-webhooks.ts
 */
const prisma = new PrismaClient();
const PORT = process.env.PORT ?? "3001";
const URL = `http://localhost:${PORT}/webhooks/tiendanube`;
const SECRET = process.env.TN_CLIENT_SECRET ?? "";
const TEST_STORE = "test-billing-demo-9999";

function post(event: string) {
  const body = JSON.stringify({ store_id: TEST_STORE, event });
  const signature = crypto.createHmac("sha256", SECRET).update(body).digest("base64");
  return axios.post(URL, body, {
    headers: { "Content-Type": "application/json", "x-linkedstore-hmac-sha256": signature },
    validateStatus: () => true,
  });
}

async function status() {
  const s = await prisma.store.findUnique({ where: { tnStoreId: TEST_STORE } });
  return s ? s.status : "(no existe)";
}

async function main() {
  if (!SECRET) throw new Error("Falta TN_CLIENT_SECRET en .env");

  // Limpieza previa + alta de tienda de prueba ACTIVE
  await prisma.store.deleteMany({ where: { tnStoreId: TEST_STORE } });
  await prisma.store.create({
    data: { tnStoreId: TEST_STORE, name: "Tienda de prueba (billing)", accessTokenEnc: "dummy", status: "ACTIVE" },
  });
  console.log(`Tienda de prueba creada. Estado inicial: ${await status()}`);

  // 1) Firma inválida -> debe rechazar 401
  const bad = await axios.post(URL, JSON.stringify({ store_id: TEST_STORE, event: "app/suspended" }), {
    headers: { "Content-Type": "application/json", "x-linkedstore-hmac-sha256": "firma-falsa" },
    validateStatus: () => true,
  });
  console.log(`\n[firma inválida]    HTTP ${bad.status}  (esperado 401)`);

  // 2) app/suspended -> SUSPENDED
  const r1 = await post("app/suspended");
  console.log(`[app/suspended]     HTTP ${r1.status}  ->  estado: ${await status()}  (esperado SUSPENDED)`);

  // 3) app/resumed -> ACTIVE
  const r2 = await post("app/resumed");
  console.log(`[app/resumed]       HTTP ${r2.status}  ->  estado: ${await status()}  (esperado ACTIVE)`);

  // 4) customers/data_request y customers/redact -> 200 no-op
  const r3 = await post("customers/data_request");
  const r4 = await post("customers/redact");
  console.log(`[customers/*]       HTTP ${r3.status}/${r4.status}  (esperado 200/200, no-op)`);

  // 5) store/redact -> borra la tienda
  const r5 = await post("store/redact");
  console.log(`[store/redact]      HTTP ${r5.status}  ->  estado: ${await status()}  (esperado (no existe))`);

  // Limpieza por las dudas
  await prisma.store.deleteMany({ where: { tnStoreId: TEST_STORE } });
  console.log("\nOK: prueba completada (tienda de prueba eliminada).");
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
