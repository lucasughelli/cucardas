# Backend — build context = RAÍZ del repo (Railway Root Directory = vacío/raíz).
# Controla explícitamente qué queda en la imagen de runtime (incluido dist), evitando los
# problemas de Railpack (no corría prisma generate; no incluía dist en runtime).

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
# Con workspaces, npm ci necesita el package.json de todos los workspaces declarados en la raíz.
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
# El schema de Prisma debe estar antes de npm ci porque el postinstall corre `prisma generate`.
COPY apps/backend/prisma apps/backend/prisma
RUN npm ci
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
# node_modules hoisteado a la raíz por workspaces (incluye @prisma/client generado y la CLI prisma).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
