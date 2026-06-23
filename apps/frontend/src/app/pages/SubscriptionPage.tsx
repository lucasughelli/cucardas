import { IconCard } from "../../shared/components/icons";

/**
 * Plan y facturación.
 *
 * El cobro lo gestiona Tiendanube (Billing gestionado): el comercio paga junto con su factura de
 * Tiendanube, no ingresa tarjeta en esta app. El plan y su precio se configuran en el Portal de
 * Partners; estos valores deben COINCIDIR con esa configuración.
 */
const PLAN = {
  name: "Pro",
  // AJUSTAR para que coincida EXACTAMENTE con el plan configurado en partners.tiendanube.com.
  price: "$ —",
  interval: "por mes",
  trialDays: 7,
  features: [
    "Cucardas de texto e imagen ilimitadas",
    "Animaciones (pulso, rebote, brillo)",
    "Tamaño y posición personalizados",
    "Mostrar en página de producto y/o listados",
    "Ocultar las cucardas nativas del tema",
    "Aplicar y quitar en lote",
  ],
};

export function SubscriptionPage() {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Plan y facturación</h1>
          <div className="page__title-sub">Tu suscripción a Cucardas, gestionada por Tiendanube.</div>
        </div>
      </div>

      <div className="card card--pad" style={{ maxWidth: 560 }}>
        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          <span
            style={{
              width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, var(--brand), #8b5cf6)", color: "#fff",
            }}
          >
            <IconCard />
          </span>
          <div>
            <strong style={{ fontSize: 18 }}>Plan {PLAN.name}</strong>
            <div className="help">
              {PLAN.price} {PLAN.interval} · {PLAN.trialDays} días de prueba gratis
            </div>
          </div>
        </div>

        <ul style={{ margin: "18px 0", paddingLeft: 18, lineHeight: 1.9 }}>
          {PLAN.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <div
          style={{
            background: "var(--surface-2, #f6f6f9)", borderRadius: 10, padding: "12px 14px",
            fontSize: 13, color: "var(--text-2)",
          }}
        >
          <strong>El cobro lo gestiona Tiendanube.</strong> El importe aparece en tu factura de
          Tiendanube; no ingresás datos de tarjeta en esta app. Si no se abona, Tiendanube suspende
          el acceso automáticamente y las cucardas dejan de mostrarse hasta regularizar el pago.
        </div>

        <div style={{ marginTop: 16 }}>
          <p className="label" style={{ marginBottom: 4 }}>¿Cómo cambio o cancelo mi plan?</p>
          <p className="help" style={{ margin: 0 }}>
            Desde tu panel de Tiendanube: <strong>Mi Tiendanube → Aplicaciones → Cucardas</strong>.
            Para cancelar, podés desinstalar la app desde ahí en cualquier momento. Tras la
            desinstalación se aplica nuestra <a href="/privacy.html" target="_blank" rel="noreferrer">Política de Privacidad</a> respecto a tus datos.
          </p>
        </div>
      </div>
    </div>
  );
}
