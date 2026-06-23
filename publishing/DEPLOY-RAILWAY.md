# Deploy a producción — Railway (backend) + Vercel (frontend)

Guía paso a paso. Resultado final: dos URLs estables y públicas, sin túneles nunca más.

```
Backend + Postgres → Railway   →  https://<algo>.up.railway.app
Frontend (panel)   → Vercel     →  https://<algo>.vercel.app
```

> Todo el código ya está preparado (Dockerfile, railway.json, vercel.json, storage opcional, secretos
> generados). Vos hacés los clics; yo dejo cada valor listo para copiar/pegar.

---

## 0. Cuentas que vas a crear (gratis)
- **GitHub** — para guardar el código y conectar deploys: https://github.com/signup
- **Railway** — backend + base de datos: https://railway.app (entrá con GitHub)
- **Vercel** — frontend: https://vercel.com (entrá con GitHub)

Railway pide una tarjeta para el plan Hobby (~US$5/mes) pero arranca con crédito de prueba. Vercel es gratis.

---

## 1. Subir el código a GitHub

Ya dejé el repo commiteado localmente (sin secretos). Solo falta crear el repo remoto y empujar:

1. En GitHub: **New repository** → nombre `cucardas` → **Private** → *Create* (NO agregues README).
2. En tu terminal, dentro de `tiendanube-cucardas`:
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/cucardas.git
   git push -u origin main
   ```
   (Si te pide login, GitHub abre el navegador para autorizar.)

> Verificá en GitHub que **NO** se subieron `apps/backend/.env` ni `ngrok.yml` (no deberían estar; los bloquea el `.gitignore`).

---

## 2. Backend + Postgres en Railway

1. Railway → **New Project** → **Deploy from GitHub repo** → elegí `cucardas`.
2. Railway detecta el `railway.json` y construye con el Dockerfile del backend. Dejalo construir.
3. **Agregar Postgres**: en el proyecto → **+ New** → **Database** → **PostgreSQL**. Railway crea la DB
   y expone `DATABASE_URL`.
4. **Conectar la DB al backend**: en el servicio del backend → pestaña **Variables** → **+ New Variable**
   → **Add Reference** → elegí `DATABASE_URL` de Postgres. (Así el backend usa esa DB.)
5. **Cargar el resto de variables** (Variables → RAW Editor, pegá esto y completá los TN_*):

   ```
   NODE_ENV=production
   APP_BASE_URL=https://PENDIENTE.up.railway.app
   FRONTEND_URL=https://PENDIENTE.vercel.app
   JWT_SECRET=65fe9ea4bf522e4d3360892b4f38107ed6e483ef64257d7a8cf59ee737f52132
   JWT_EXPIRES_IN=7d
   TOKEN_ENCRYPTION_KEY=4b29907097664c59bc4b31bf5bbfdc9eba5d8f6e96dad1f9b7976fcd3fa621f1
   TN_CLIENT_ID=25462
   TN_CLIENT_SECRET=PEGA_TU_CLIENT_SECRET
   TN_REDIRECT_URI=https://PENDIENTE.up.railway.app/auth/tiendanube/callback
   TN_API_BASE_URL=https://api.tiendanube.com/v1
   TN_APP_USER_AGENT=Cucardas App (soporte@tudominio.com)
   TN_SCRIPT_ID=7634
   SEED_ADMIN_EMAIL=tu-admin@tudominio.com
   SEED_ADMIN_PASSWORD=elegí-una-contraseña-fuerte
   PURGE_GRACE_DAYS=90
   ```
   - `TN_CLIENT_SECRET` lo sacás de tu `apps/backend/.env` actual (es el mismo que ya usás).
   - `DATABASE_URL`, `PORT` los pone Railway solo — **no los cargues a mano**.
   - Las `S3_*` **no hacen falta** todavía (storage es opcional; las cucardas de texto andan sin él).

6. **Generar el dominio público**: servicio backend → **Settings** → **Networking** → **Generate Domain**.
   Te da algo como `cucardas-production.up.railway.app`. **Copiala.**
7. Volvé a **Variables** y reemplazá los `PENDIENTE` del backend por ese dominio:
   - `APP_BASE_URL=https://cucardas-production.up.railway.app`
   - `TN_REDIRECT_URI=https://cucardas-production.up.railway.app/auth/tiendanube/callback`
   Railway redeploya solo.
8. **Verificá**: abrí `https://TU-DOMINIO.up.railway.app/health` → debe responder `{"status":"ok"}`.
   (Las migraciones de la base corren solas al arrancar el contenedor.)

---

## 3. Crear el usuario admin del panel

Una sola vez, con la base ya creada. En Railway, servicio backend → pestaña **Settings** → no hay shell,
así que usamos el **seed** vía un redeploy con el comando, o más simple, desde tu máquina apuntando a la DB
de Railway:

```bash
# en apps/backend, con DATABASE_URL de Railway (copiala de la pestaña Variables de Postgres → "Connect")
DATABASE_URL="postgresql://...railway..." SEED_ADMIN_EMAIL="tu-admin@tudominio.com" SEED_ADMIN_PASSWORD="tu-pass" npx tsx prisma/seed.ts
```
> En producción el seed exige email y password (no usa la default). Guardá esa contraseña.

---

## 4. Frontend en Vercel

1. Vercel → **Add New… → Project** → importá el repo `cucardas`.
2. **Root Directory**: `apps/frontend`  (clic en *Edit* y seleccioná esa carpeta).
3. Framework: **Vite** (lo detecta solo). Build: `npm run build`. Output: `dist`.
4. **Environment Variables** → agregá:
   ```
   VITE_API_URL = https://TU-DOMINIO.up.railway.app
   ```
   (la URL del backend de Railway, paso 2.6)
5. **Deploy**. Te da una URL tipo `https://cucardas-xxx.vercel.app`. **Copiala.**
6. Verificá que carguen las páginas legales:
   `https://cucardas-xxx.vercel.app/privacy.html` y `/terms.html`.

---

## 5. Conectar frontend ↔ backend (CORS)

En Railway → backend → Variables → poné el dominio real de Vercel en:
```
FRONTEND_URL=https://cucardas-xxx.vercel.app
```
Redeploya solo. (El CORS del backend ya acepta ese origen vía `FRONTEND_URL`.)

---

## 6. Actualizar la app en Tiendanube Partners

En partners.tiendanube.com, en tu app:
1. **URL de redirección (callback)**: `https://TU-DOMINIO.up.railway.app/auth/tiendanube/callback`
2. **URL de la app** (donde abre el panel): `https://cucardas-xxx.vercel.app`
3. **Privacidad**: `https://cucardas-xxx.vercel.app/privacy.html`
4. **Términos**: `https://cucardas-xxx.vercel.app/terms.html`
5. Guardá.

Luego **re-apuntá el Script** de tu tienda al backend de producción (una sola vez; ya no es un túnel):
```bash
# en apps/backend, con el .env apuntando APP_BASE_URL al dominio de Railway
# (o exportá APP_BASE_URL inline)
APP_BASE_URL="https://TU-DOMINIO.up.railway.app" DATABASE_URL="postgresql://...railway..." \
  TN_CLIENT_ID=25462 TN_CLIENT_SECRET=... TN_SCRIPT_ID=7634 TOKEN_ENCRYPTION_KEY=4b29...21f1 \
  npx tsx scripts/repoint-script.ts
```
> A partir de acá el `api_base` es fijo y **no se rompe nunca más**. Los webhooks (incluido
> `app/uninstalled`) se registran solos en cada instalación contra el dominio de Railway.

---

## 7. Smoke test final (antes de enviar a revisión)

- [ ] `https://TU-DOMINIO.up.railway.app/health` → 200.
- [ ] Entrá al panel (`https://cucardas-xxx.vercel.app`) → te redirige a "Conectar con Tiendanube".
- [ ] **Reinstalá la app en una tienda de prueba** desde cero (OAuth completo contra producción).
- [ ] Creá una cucarda de texto y aplicala a un producto.
- [ ] Abrí la página de ese producto en el storefront → la cucarda se ve (sin túneles).
- [ ] Desinstalá → llega `app/uninstalled` (la tienda pasa a SUSPENDED).
- [ ] `/privacy.html` y `/terms.html` accesibles.

---

## 8. Cosas que quedan para después (no bloquean publicar)
- **Storage de imágenes** (cucardas de imagen): agregar un bucket S3/R2 y cargar las `S3_*` en Railway.
  Mientras tanto, las cucardas de **texto** funcionan al 100%.
- **Dominio propio** (`app.tudominio.com`): se puede apuntar a Vercel/Railway cuando quieras; las URLs
  `.vercel.app` / `.up.railway.app` ya son válidas para publicar.
- **Cron de purga** (`purge-uninstalled.ts`): programarlo (Railway Cron) para cumplir la política de datos.

---

## 9. Problemas comunes
- **Build de Railway falla**: revisá los logs del deploy. Casi siempre es una variable faltante (el backend
  valida el `.env` al arrancar y te dice cuál falta).
- **CORS bloquea el panel**: confirmá que `FRONTEND_URL` en Railway sea EXACTAMENTE la URL de Vercel (con https, sin barra final).
- **OAuth no vuelve**: el `TN_REDIRECT_URI` de Railway y el de Partners tienen que ser idénticos.
- **La cucarda no aparece**: corré de nuevo el `repoint-script.ts` apuntando a Railway y hacé Ctrl+F5.
