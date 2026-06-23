# Guía de despliegue a producción

Objetivo: pasar de localhost + túnel efímero a una infraestructura pública y estable, requisito para
que Tiendanube apruebe y publique la app.

## 0. Lo que necesitás

- Un **dominio** (ej. `tudominio.com`) con subdominios para API y panel.
- Cuenta en un host para el **backend** (recomendado: Railway o Render).
- **Postgres gestionado** (Neon, Supabase o el add-on del host).
- **Almacenamiento S3 real o Cloudflare R2** (reemplaza al MinIO local).
- Tu app de Partners en **partners.tiendanube.com**.

## 1. Arquitectura de despliegue

```
app.tudominio.com   ->  Frontend (Vite SPA, host estático)        [Vercel/Netlify/Cloudflare Pages]
api.tudominio.com   ->  Backend (Express + Prisma)                [Railway/Render]
cdn.tudominio.com   ->  Bucket S3/R2 público (imágenes de cucardas)
db                  ->  Postgres gestionado                       [Neon/Supabase]
```

## 2. Base de datos

1. Crear una instancia Postgres gestionada y obtener el `DATABASE_URL` (con `sslmode=require`).
2. Las migraciones se aplican solas al arrancar el contenedor (`prisma migrate deploy` en el CMD del
   Dockerfile). Si deployás sin Docker, corré `npm run prisma:deploy -w apps/backend` en el release.
3. Crear el usuario admin del panel: setear `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` y correr
   `npm run seed -w apps/backend` una vez. (En producción el seed **falla** si no los definís — a
   propósito, para no dejar credenciales por defecto.)

## 3. Almacenamiento de imágenes (reemplazar MinIO)

- Crear un bucket en **S3** o **Cloudflare R2** con acceso de lectura público para los objetos servidos.
- Completar `S3_*` del `.env.production.example`. Para R2/S3 virtual-host: `S3_FORCE_PATH_STYLE=false`.
- `S3_PUBLIC_URL` = el dominio público del bucket/CDN (ej. `https://cdn.tudominio.com`).

## 4. Backend

**Opción A — Docker (Railway/Render/Fly):**
```bash
docker build -f apps/backend/Dockerfile -t cucardas-backend .
```
Cargar las variables del `.env.production.example` como secretos del servicio. El contenedor corre
migraciones y arranca en el puerto 3001.

**Opción B — Buildpack/Nixpacks (Railway/Render autodetecta):**
- Build: `npm ci && npm run build -w apps/backend`
- Start: `npm run prisma:deploy -w apps/backend && npm run start -w apps/backend`
- Healthcheck: `GET /health`

## 5. Frontend

Es una SPA estática. La opción más simple es un host estático:
```bash
# build local o en el CI
VITE_API_URL=https://api.tudominio.com npm run build -w apps/frontend
# subir apps/frontend/dist a Vercel / Netlify / Cloudflare Pages
```
- Configurar **SPA fallback** (todas las rutas → `index.html`).
- `VITE_API_URL` debe apuntar a `https://api.tudominio.com` (se inyecta en build time).
- Verificar que `https://app.tudominio.com/privacy.html` y `/terms.html` carguen (son archivos de
  `apps/frontend/public/`, se publican automáticamente).

## 6. Configurar la app en Partners (Tiendanube)

1. **URLs de la app:**
   - URL de redirección (callback): `https://api.tudominio.com/auth/tiendanube/callback`
   - URL de la app (donde se abre el panel): `https://app.tudominio.com`
2. **Scopes:** solo lectura de productos + escritura de scripts/webhooks (mínimos).
3. **Script:** crear el Script una vez (con `is_auto_install` **OFF**), apuntando al widget. Copiar su
   ID a `TN_SCRIPT_ID`. El widget se sirve desde `https://api.tudominio.com/widget/cucardas.js`.
4. **Webhooks:** los registra la app sola al instalar (`app/uninstalled`, `product/*`). No hace falta
   cargarlos a mano, pero verificá que apunten a `https://api.tudominio.com/webhooks/tiendanube`.
5. **Privacidad / Términos:** pegar las URLs de §5.
6. **Soporte:** email y, opcionalmente, URL de ayuda.

## 7. Smoke test de producción (antes de enviar a revisión)

- [ ] `GET https://api.tudominio.com/health` responde `200 {status:"ok"}`.
- [ ] Instalar la app en una **tienda de prueba limpia** desde cero (OAuth completo).
- [ ] Tras instalar: el Script queda asociado y los webhooks registrados (revisar `GET /scripts` y
      `GET /webhooks` de la tienda, o los logs).
- [ ] Crear una cucarda y aplicarla a un producto.
- [ ] Verla renderizada en la página de producto del storefront, sin errores de consola.
- [ ] **Desinstalar** la app y confirmar que llega el webhook `app/uninstalled` (la tienda pasa a
      SUSPENDED y el script se desactiva).
- [ ] `https://app.tudominio.com/privacy.html` y `/terms.html` accesibles públicamente.

## 8. Operación continua

- Programar el cron de purga: `npx tsx prisma/purge-uninstalled.ts` (diario).
- Monitorear `/health` y los logs.
- Backups automáticos de Postgres (los proveedores gestionados lo traen).
