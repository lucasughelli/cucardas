# Checklist maestro — envío a revisión de Tiendanube

Estado del MVP `tiendanube-cucardas` para publicar en el app store. Dividido en **(A) lo que ya está
listo en el código** y **(B) lo que tenés que hacer vos** (requiere tus cuentas/decisiones).

---

## A. Listo en el código ✅

| Requisito de revisión | Estado | Dónde |
|---|---|---|
| OAuth completo (install + callback) | ✅ | `modules/auth` |
| Token de acceso cifrado en reposo (AES-256-GCM) | ✅ | `lib/crypto.ts`, `stores.service.ts` |
| Manejo de **desinstalación** (`app/uninstalled`) | ✅ | `webhooks.routes.ts` → marca SUSPENDED + desactiva script |
| **Registro de webhooks en la instalación** | ✅ (nuevo) | `webhooks.service.ts` + callback |
| Webhooks de **billing** (`app/suspended`, `app/resumed`) | ✅ (nuevo) | suspende/reactiva la tienda según pago |
| Webhooks **LGPD obligatorios** (`store/redact`, `customers/redact`, `customers/data_request`) | ✅ (nuevo) | `webhooks.routes.ts` |
| Manejo de `402 Payment Required` | ✅ (nuevo) | `tiendanubeClient.ts` |
| Página de **Plan/Suscripción** + cómo cambiar plan | ✅ (nuevo) | `SubscriptionPage.tsx` (`/subscription`) |
| Verificación de firma HMAC en webhooks | ✅ | `webhooks.routes.ts` |
| Widget no rompe el storefront (falla silenciosa) | ✅ | `cucardas-widget.client.js` |
| Rate limiting en API pública del widget | ✅ | `widget.routes.ts` |
| Cabeceras de seguridad (helmet) + trust proxy | ✅ (nuevo) | `app.ts` |
| Seed sin credenciales por defecto en producción | ✅ (nuevo) | `prisma/seed.ts` |
| Política de retención + purga de datos | ✅ (nuevo) | `prisma/purge-uninstalled.ts`, `DATA-HANDLING.md` |
| Páginas de privacidad y términos servidas públicas | ✅ (nuevo) | `apps/frontend/public/privacy.html`, `terms.html` |
| Scopes mínimos (productos + scripts/webhooks) | ✅ (configurar en Partners) | — |
| Artefactos de despliegue (Docker, env prod) | ✅ (nuevo) | `apps/*/Dockerfile`, `.env.production.example` |

---

## B. Lo que tenés que hacer vos 🔧

### B1. Completar placeholders legales/listing
- [ ] En `privacy.html` y `terms.html`: reemplazar `[TU_RAZÓN_SOCIAL]`, `[TU_EMAIL_DE_SOPORTE]`,
      `[TU_PROVEEDOR_HOSTING]`, `[TU_PROVEEDOR_S3]`, `[JURISDICCIÓN]`, `[TU_DOMINIO_APP]`.
- [ ] En `publishing/APP-LISTING.md`: completar email/URLs de soporte.
- [ ] Decidir modelo de cobro (gratis al lanzamiento, o pago vía Tiendanube Billing) y ajustar la
      sección 4 de `terms.html`.

### B2. Infraestructura (ver `publishing/DEPLOYMENT.md`)
- [ ] Comprar/configurar dominio + subdominios (`app.`, `api.`, `cdn.`).
- [ ] Deploy del **backend** (Railway/Render) con las vars de `.env.production.example`.
- [ ] Postgres gestionado + correr migraciones + seed admin (con password propia).
- [ ] **S3/R2 real** (reemplazar MinIO). Migrar `S3_*`.
- [ ] Deploy del **frontend** estático con `VITE_API_URL` apuntando a la API pública.

### B3. Configurar la app en partners.tiendanube.com
- [ ] Cargar URL de redirección: `https://api.tudominio.com/auth/tiendanube/callback`.
- [ ] Cargar URL de la app: `https://app.tudominio.com`.
- [ ] Setear scopes mínimos.
- [ ] Crear el **Script** (con `is_auto_install` OFF) → poner su ID en `TN_SCRIPT_ID`.
- [ ] Pegar URLs de privacidad y términos.
- [ ] Cargar email de soporte.

### B3.bis Billing (ver `publishing/BILLING.md`)
- [ ] Configurar el **plan y precio** de la app en el Portal de Partners (con días de prueba).
- [ ] Igualar el precio/plan en `apps/frontend/src/app/pages/SubscriptionPage.tsx` (constante `PLAN`)
      y en `APP-LISTING.md`.
- [ ] Declarar precios/planes/trial en el listing (transparencia, requisito de revisión).

### B4. Assets del listing (ver `publishing/SCREENSHOTS-GUIDE.md`)
- [ ] Exportar `app-icon.svg` a PNG (512/256/128).
- [ ] Tomar 5–6 capturas (priorizar el "antes/después" y la cucarda en el storefront real).
- [ ] (Opcional) Video de 20–40s.
- [ ] Pegar el copy de `APP-LISTING.md` (ES y, si vas a Brasil, PT).

### B5. Smoke test de producción (ver §7 de DEPLOYMENT.md)
- [ ] Instalar en una tienda de prueba limpia, crear y ver una cucarda, desinstalar y verificar limpieza.
- [ ] Sin errores de consola en el storefront; no se rompe ningún tema.

### B6. Enviar a revisión
- [ ] Desde Partners, completar la ficha y apretar **Enviar a revisión**.
- [ ] Estar atento al email de Tiendanube por feedback de la revisión.

---

## Cosas que NO puedo hacer por vos (y por qué)
- **Deploy a producción / comprar dominio / crear buckets:** requieren tus cuentas y medios de pago.
- **Crear el listing y apretar "enviar":** se hace en tu panel de Partners.
- **Aceptar términos del programa de Partners:** es una acción tuya.
- **Aprobar la revisión:** lo decide Tiendanube.

Todo lo demás (código, artefactos, textos, configuración documentada) está listo en este repo.

---

## Mejoras opcionales antes/después de publicar (no bloquean)
- Traducir `privacy.html` / `terms.html` a PT si vas a listar en Brasil.
- Pantalla in-app para cambiar la contraseña del admin (hoy se hace por DB/seed).
- Modelo de cobro vía Tiendanube Billing (si vas a monetizar desde el día 1).
- Mover el widget a CDN con config pre-compilada (es el salto de arquitectura de **BadgePro v2**, ver
  `../../BadgePro/`).
