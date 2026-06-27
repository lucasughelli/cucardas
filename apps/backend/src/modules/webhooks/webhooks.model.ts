// WebhookEndpoint: tienda registra URLs para que les notifiquemos cambios
// (ej: "cuando una cucarda cambia, POST a https://miapp.com/webhook")
export interface WebhookEndpoint {
  id: string;
  storeId: string;
  url: string;
  events: string[]; // "design.updated", "design.deleted", etc
  active: boolean;
  createdAt: Date;
}
