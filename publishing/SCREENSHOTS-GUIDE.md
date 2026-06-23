# Guía de capturas para el listing

Tiendanube pide imágenes del listing. Las capturas son el factor que más convierte: mostrá
el **resultado** (la cucarda sobre un producto real), no solo el panel.

## Ícono
- Usar `app-icon.svg` (exportar a PNG 512×512 con fondo). Para fondos requeridos: el ícono ya trae su
  propio fondo redondeado. Exportá también 256×256 y 128×128 por las dudas.
- Export rápido: abrir el SVG en el navegador → captura, o `npx svgexport app-icon.svg icon-512.png 512:512`.

## Capturas recomendadas (5–6, formato horizontal ~1280×800)

1. **Antes/Después (la más importante):** una foto de producto sin cucarda al lado de la misma con
   "OFERTA −30%". Título overlay: "Destacá tus ofertas en segundos".
2. **Editor de cucarda:** el modal de creación con el preview en vivo. Título: "Creá cucardas con tu marca".
3. **Cucarda sobre producto real en el storefront:** captura de la página de producto de tu tienda con
   la cucarda renderizada (podés usar Beauty Shoes). Título: "Se ve sobre tus productos reales".
4. **Variedad de cucardas:** grilla mostrando NUEVO, ENVÍO GRATIS, ÚLTIMAS UNIDADES, CUOTAS.
   Título: "Etiquetas para cada necesidad".
5. **Panel / lista de cucardas:** mostrando que es simple administrar. Título: "Todo desde un panel simple".
6. (Opcional) **Animaciones / tamaño:** mostrar opciones de animación y tamaño ajustable.

## Cómo tomarlas
- Levantá el frontend (`npm run dev` en `apps/frontend`) y el backend, entrá con una tienda real.
- Para las del storefront, usá tu tienda de prueba (Beauty Shoes) con cucardas aplicadas.
- Mantené un estilo visual consistente (mismo fondo, misma tipografía en los títulos overlay).
- Evitá datos sensibles en pantalla (emails, tokens).

## Video (opcional pero recomendado, 20–40s)
Flujo: instalar → crear una cucarda "OFERTA" → aplicarla a un producto → mostrarla en el storefront.
Un video sube mucho la conversión del listing.
