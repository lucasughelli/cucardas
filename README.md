# Cucardas para Tiendanube

App para crear cucardas (stickers/badges: Nuevo, Oferta, Envío Gratis, etc.) con un editor visual
y aplicarlas a productos de una tienda Tiendanube, sin modificar las imágenes reales del producto.

Este repo es la **Fase 1 (MVP)**: flujo completo end-to-end (OAuth, editor, diseños, aplicar a
productos, panel admin básico). Funcionalidades avanzadas quedan para una Fase 2 — ver
[Qué queda para Fase 2](#qué-queda-para-fase-2).

## Cómo funciona "aplicar una cucarda a un producto"

Tiendanube no tiene una forma reversible de superponer una imagen sobre la foto de un producto.
En vez de eso, esta app sigue el patrón estándar de las apps de badges en Tiendanube:

1. Al instalar la app, el backend registra un **Script Tag** de Tiendanube que apunta a
   `/widget/cucardas.js`.
2. Ese script corre en el storefront de la tienda, detecta el producto que se está viendo, y le
   pregunta a la API pública de esta app (`/api/public/assignments`) qué cucarda(s) tiene asignadas.
3. El widget dibuja la cucarda como una imagen superpuesta sobre la foto del producto, en el navegador
   del comprador — el producto real en Tiendanube nunca se modifica.

Esto hace que aplicar/quitar cucardas sea instantáneo y reversible, y no consume cuota de la API de
Tiendanube en la tienda del merchant.

**Limitación conocida:** detectar el ID del producto actual en el storefront depende de cómo esté
armado el tema de cada tienda. El widget (`apps/backend/src/modules/widget/cucardas-widget.client.js`)
prueba, en este orden: (1) un meta tag `<meta name="cucardas-product-id">`, (2) el JSON-LD de producto
que la mayoría de los temas incluye para SEO, (3) la variable global `window.LS.product.id` que
exponen algunos temas. Si en tu tema ninguno de los tres funciona, agregá el meta tag manualmente en
el template del producto.

## Estructura

```
tiendanube-cucardas/
  apps/
    backend/   Node + Express + TypeScript + Prisma/PostgreSQL
    frontend/  React + TypeScript + Vite + Fabric.js
  docker-compose.yml   Postgres + MinIO para desarrollo local
```

## Requisitos

- Node.js 18+
- Docker Desktop (para Postgres y MinIO locales)
- Una App creada en [partners.tiendanube.com](https://partners.tiendanube.com) con su Client ID y
  Client Secret

## Setup

```bash
# 1. Instalar dependencias de ambos workspaces
npm install

# 2. Variables de entorno
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# Completá TN_CLIENT_ID, TN_CLIENT_SECRET y VITE_TN_APP_ID con los datos reales de tu app
# en partners.tiendanube.com. Generá JWT_SECRET y TOKEN_ENCRYPTION_KEY con:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Levantar Postgres + MinIO
npm run db:up

# 4. Aplicar el esquema de base de datos (la primera vez crea la migración inicial)
npm run db:migrate

# 5. Crear el usuario admin del panel interno
npm run seed -w apps/backend
# (te va a mostrar el email/contraseña que se generaron si no usaste SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD)

# 6. Levantar todo
npm run dev
```

- Backend: http://localhost:3001
- Frontend (app embebida): http://localhost:5173
- Panel admin: http://localhost:5173/admin/login

## Configurar la app en Tiendanube Partners

1. En partners.tiendanube.com, creá una App y anotá el **Client ID** y **Client Secret**.
2. **Redirect URI**: `http://localhost:3001/auth/tiendanube/callback` (en producción, la URL real de tu backend).
3. **App URL** (la que carga Tiendanube dentro del iframe del admin): la URL de tu frontend, ej.
   `http://localhost:5173` en desarrollo. Para probar el flujo de instalación real necesitás exponer
   tu backend con HTTPS público (ej. `ngrok http 3001`) y actualizar `TN_REDIRECT_URI`/`APP_BASE_URL`
   acordemente, porque Tiendanube no redirige a `localhost` desde su propio dominio.
4. En los permisos/scopes de la app, habilitá como mínimo lectura de **productos** y
   lectura/escritura de **script tags** (los nombres exactos pueden variar en el panel de
   Tiendanube; son los dos permisos que usa esta app).

## Variables de entorno

Ver `apps/backend/.env.example` y `apps/frontend/.env.example` para la lista completa, con
comentarios de qué es cada una. Ningún secreto real está commiteado — los `.env` están en
`.gitignore`.

## Tests

```bash
npm run test -w apps/backend     # tests unitarios + integración (Vitest + Supertest)
npm run typecheck:test -w apps/backend  # typecheck estricto incluyendo los tests
```

Cubren: intercambio de token OAuth con Tiendanube, retry/rate-limit del cliente de la API de
Tiendanube (respeta `Retry-After` ante 429), aislamiento de tenant y audit log del servicio de
asignaciones, y wiring de la app (auth requerida, firma de webhooks, 404).

## Comandos útiles (raíz del repo)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Backend + frontend en paralelo |
| `npm run db:up` / `npm run db:down` | Levanta/apaga Postgres + MinIO |
| `npm run db:migrate` | Corre las migraciones de Prisma |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base |
| `npm run build` | Build de producción de ambos workspaces |

## Qué queda para Fase 2

Quedó deliberadamente fuera de esta entrega para no diluir el esfuerzo en un MVP que funcione
de punta a punta:

- API pública documentada para que terceros integren la herramienta.
- Sincronización en tiempo real entre tabs vía WebSocket (hoy se resuelve con refetch al
  enfocar la pestaña, vía React Query).
- Alertas automáticas (email/Slack) para errores críticos — hoy quedan logueados y visibles
  en `/admin/errors`, pero no se notifican proactivamente.
- AWS S3 real en producción — hoy usa MinIO local; migrar es solo cambiar las variables
  `S3_*` por las de un bucket real (el código usa `@aws-sdk/client-s3`, compatible con ambos).
- Historial de undo/redo persistente entre sesiones (hoy el undo/redo del editor vive en memoria
  durante la sesión de edición; el historial de versiones guardadas sí persiste en la base).
- Gestión de usuarios admin desde la UI (hoy se crean por seed/script).

## Notas de arquitectura

- El acceso de Tiendanube (`access_token`) no expira ni tiene refresh token — Tiendanube lo
  revoca solo si el merchant desinstala la app. Por eso no hay lógica de "renovar token"; la
  única forma de recuperar el acceso es que el merchant vuelva a autorizar la app.
- El header de autenticación contra la API de Tiendanube es `Authentication: bearer <token>`
  (no `Authorization`) — es una particularidad real de su API, no un error de tipeo.
- Los tokens de Tiendanube se guardan cifrados (AES-256-GCM) en la base, nunca en texto plano.
