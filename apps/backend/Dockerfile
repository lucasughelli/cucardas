# Backend (Express + Prisma). Construir con contexto = raíz del repo:
#   docker build -f apps/backend/Dockerfile -t cucardas-backend .
# (el contexto raíz es necesario por los npm workspaces / lockfile compartido)

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
# OpenSSL es requerido por el engine de Prisma en alpine
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
# Con npm workspaces, npm ci necesita el package.json de TODOS los workspaces declarados en la raíz
# (apps/backend y apps/frontend), aunque solo construyamos el backend.
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN npx prisma generate && npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
# node_modules hoisteado a la raíz por workspaces (incluye @prisma/client generado y la CLI de prisma)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
EXPOSE 3001
# Aplica migraciones pendientes y arranca. (Si preferís correr migrate como paso de release
# separado, quitá "npx prisma migrate deploy &&" y ejecutalo en tu pipeline.)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
