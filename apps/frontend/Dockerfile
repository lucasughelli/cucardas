# Frontend (Vite SPA) servido por nginx. Autónomo: build context = apps/frontend
# (Railway Root Directory = apps/frontend). No depende del lockfile de la raíz del monorepo.

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --include=dev fuerza instalar devDependencies (tsc, vite) aunque NODE_ENV=production.
RUN npm ci --include=dev
COPY . .
# Vite inyecta las VITE_* en build time. Las variables de entorno se pasan via --build-arg en Railway.
# Si no están, usa valores por defecto para evitar que el build falle.
ARG VITE_API_URL=https://api.example.com
ARG VITE_TN_APP_ID=app-id
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TN_APP_ID=$VITE_TN_APP_ID
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine AS runtime
# La imagen oficial de nginx procesa /etc/nginx/templates/*.template con envsubst al iniciar,
# sustituyendo ${PORT} (env var que inyecta Railway). Las variables de nginx ($uri, $host) NO son
# variables de entorno, así que envsubst las deja intactas.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
