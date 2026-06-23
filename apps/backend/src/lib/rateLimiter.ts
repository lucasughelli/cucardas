import Bottleneck from "bottleneck";

const limiters = new Map<string, Bottleneck>();

/**
 * Tiendanube aplica rate limit por tienda (~2 req/seg con ráfaga corta). Un limiter por
 * tnStoreId evita pisar la cuota de una tienda con el tráfico de otra.
 */
export function getStoreLimiter(tnStoreId: string): Bottleneck {
  let limiter = limiters.get(tnStoreId);
  if (!limiter) {
    limiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });
    limiters.set(tnStoreId, limiter);
  }
  return limiter;
}
