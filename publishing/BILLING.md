# Billing — modelo de cobro (Tiendanube Billing)

Cómo cobra la app y qué tenés que configurar. Basado en la documentación oficial verificada de
Tiendanube/Nuvemshop.

## Modelo (verificado en los docs oficiales)

- **El cobro lo gestiona Tiendanube**, no la app. **No existe un endpoint público para crear cargos**
  (a diferencia de Shopify). Vos configurás el/los plan(es) y precio en el **Portal de Partners**;
  Tiendanube le cobra al comercio junto con su factura de Tiendanube.
- Si el comercio **no paga**, Tiendanube hace cumplir el cobro automáticamente: todas las llamadas a
  la API devuelven **`402 Payment Required`**, **no se sirven los Scripts** y **no se llaman los
  webhooks**. En la práctica, la app deja de funcionar sola hasta que regularice.
- La app se entera del estado de pago por dos webhooks: **`app/suspended`** (se cortó el acceso) y
  **`app/resumed`** (se regularizó).

Referencias:
- https://tiendanube.github.io/api-documentation/intro (sección de billing / 402)
- https://dev.nuvemshop.com.br/en/docs/applications/guidelines

## Qué hace la app (ya implementado)

- Se **suscribe** a `app/suspended` y `app/resumed` al instalar (junto al resto de webhooks).
- En `app/suspended` marca la tienda `SUSPENDED` (sin `uninstalledAt`, para distinguir de una baja);
  en `app/resumed` la vuelve a `ACTIVE`. Suspendida, la API pública del widget deja de devolver
  cucardas.
- Si recibe un `402` de la API de Tiendanube, marca la tienda suspendida como red de seguridad.
- Página **"Plan y facturación"** en el panel (`/subscription`) que explica el plan, el precio, la
  prueba gratis, que el cobro es vía Tiendanube, y cómo cambiar/cancelar el plan.

## Modelo de plan recomendado para el lanzamiento

**Un solo plan pago + período de prueba gratis** (ej. Plan Pro, 7 días de prueba). Por qué:

- Tiendanube no expone por API en qué plan está el comercio, así que distinguir niveles (Free/Pro)
  con límites aplicados dentro de la app no es confiable hoy. Con **un plan**, Tiendanube hace cumplir
  el pago y la app no necesita "gating" por nivel.
- El requisito de revisión de "permitir upgrade/downgrade sin contactar a soporte" **aplica solo si
  tenés varios planes**. Con un plan único, se sortea limpiamente; el comercio cancela desinstalando.

> Multi-plan con límites por nivel dentro de la app es una mejora de **v2** (necesita el sistema de
> entitlements de BadgePro y, para detectar el plan, confirmar la Billing API con partner support).

## Qué tenés que hacer vos (en partners.tiendanube.com)

1. **Configurar el plan y precio** de la app en el Portal de Partners (nombre, precio, moneda,
   días de prueba). Estos valores deben **coincidir** con los de la página `/subscription`
   (editá la constante `PLAN` en `apps/frontend/src/app/pages/SubscriptionPage.tsx`).
2. Si en el futuro querés gestionar cargos por API, **pedile a partner support** que habilite el
   acceso de billing de tu app (partners@tiendanube.com).
3. **Declarar precios y planes en el listing** (requisito de transparencia): qué incluye el plan y
   si hay prueba gratis (ver `APP-LISTING.md`).

## Verificación

- [ ] Tras instalar, los webhooks `app/suspended` y `app/resumed` quedan registrados (revisar
      `GET /webhooks` de la tienda).
- [ ] El precio/plan de `/subscription` coincide con el del Portal de Partners.
- [ ] (Si podés simularlo) al suspender por falta de pago, la tienda pasa a SUSPENDED y las cucardas
      dejan de mostrarse; al reanudar, vuelven.
