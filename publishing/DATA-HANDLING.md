# Manejo de datos y cumplimiento (LGPD / privacidad)

Documento de referencia para la revisión de Tiendanube y para tu registro interno.

## Qué datos toca la app

| Dato | Origen | Uso | Dónde se guarda |
|---|---|---|---|
| Token de acceso de la tienda | OAuth Tiendanube | Llamar a la API de la tienda | DB, **cifrado AES-256-GCM** |
| ID, nombre, email de la tienda | OAuth / API store | Identificar la tienda, soporte | DB |
| IDs de producto, precio, stock, categoría | API Tiendanube (cache corta) | Decidir sobre qué productos mostrar cucardas | Cache en memoria (TTL) + no persistente |
| Cucardas (texto, colores, imágenes) | Creadas por el comercio | Renderizar en el storefront | DB + imágenes en S3/R2 |
| Logs de error/actividad | Sistema | Operación y diagnóstico | DB |
| Email/hash de admin interno | Seed | Login al panel admin propio | DB |

## Lo que NO recolectamos

- **Ningún dato personal del comprador final** (nombre, email, dirección, medios de pago).
- La app no lee pedidos ni clientes de la tienda. Solo catálogo de productos y lo que el comercio crea.

## Ciclo de vida y eliminación

1. **Instalación:** se guarda el token (cifrado) y se registran Script + webhooks.
2. **Uso:** datos de catálogo se consultan on-demand con cache corta; no se replica el catálogo.
3. **Desinstalación** (webhook `app/uninstalled`): la tienda se marca `SUSPENDED` + `uninstalledAt`; se desactiva el Script.
4. **Período de gracia:** 90 días (por si reinstala).
5. **Purga definitiva:** `npx tsx prisma/purge-uninstalled.ts` (cron diario) borra la tienda y, por cascade, sus cucardas/asignaciones/auditoría. Configurable con `PURGE_GRACE_DAYS`.
6. **A pedido:** el comercio puede pedir borrado inmediato a soporte.

## Webhooks LGPD obligatorios (apps públicas)

Tiendanube exige que toda app pública se suscriba a estos tres eventos. La app ya los registra al
instalar y los maneja:

| Webhook | Qué pide | Qué hace la app |
|---|---|---|
| `store/redact` | Eliminar datos de la tienda | Borra definitivamente la tienda y sus datos (cascade) |
| `customers/redact` | Eliminar datos de un comprador | No-op: no almacenamos datos de compradores; se confirma 200 |
| `customers/data_request` | Entregar datos de un comprador | No-op: no almacenamos datos de compradores; se confirma 200 |

> Como la app **no recolecta datos de compradores**, los dos webhooks de `customers` no tienen nada
> que procesar, pero la suscripción es obligatoria igual.

## Seguridad

- Tokens cifrados en reposo; todo sobre HTTPS/TLS.
- HMAC verificado en cada webhook (firma con el client secret).
- Rate limiting en la API pública del widget.
- Cabeceras de seguridad (helmet) y `trust proxy` en producción.
- Scopes de Tiendanube mínimos (solo lectura de productos + escritura de scripts/webhooks).

## URLs públicas requeridas por el listing

- Política de privacidad: `https://[TU_DOMINIO_APP]/privacy.html`
- Términos: `https://[TU_DOMINIO_APP]/terms.html`

> Recordá completar los placeholders `[TU_...]` en `privacy.html`, `terms.html` y en este documento
> antes de enviar a revisión.
