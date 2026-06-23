# Backend autónomo: build context = apps/backend (Root Directory de Railway = apps/backend).
# No depende del lockfile ni de los workspaces de la raíz del monorepo.

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json ./
# --include=dev fuerza instalar devDependencies (tsc, prisma, tsx) aunque NODE_ENV=production.
RUN npm install --include=dev
COPY . .
RUN npx prisma generate && npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3001
# Aplica migraciones pendientes y arranca.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
