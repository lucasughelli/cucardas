import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Tiendanube embebe la app en un iframe dentro del admin de la tienda.
    headers: {
      "Content-Security-Policy": "frame-ancestors 'self' https://*.tiendanube.com https://*.mitiendanube.com",
    },
    // Permite acceder al dev server a través de túneles (ngrok/Cloudflare Tunnel) para probar
    // el flujo OAuth real de Tiendanube, que necesita una URL pública HTTPS.
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok-free.dev"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
