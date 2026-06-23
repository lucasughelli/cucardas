# Frontend (Vite SPA) servido por nginx. Construir con contexto = raíz del repo:
#   docker build -f apps/frontend/Dockerfile \
#     --build-arg VITE_API_URL=https://api.tudominio.com \
#     -t cucardas-frontend .
#
# Alternativa más simple: en vez de Docker, deployá la carpeta apps/frontend/dist como sitio
# estático en Vercel / Netlify / Cloudflare Pages (ver publishing/DEPLOYMENT.md). No necesitás
# este Dockerfile si usás un host estático.

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci
COPY apps/frontend apps/frontend
# Vite inyecta las VITE_* en build time
ARG VITE_API_URL
ARG VITE_TN_APP_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TN_APP_ID=$VITE_TN_APP_ID
WORKDIR /app/apps/frontend
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine AS runtime
# SPA fallback: cualquier ruta desconocida sirve index.html (para el router del lado cliente)
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
