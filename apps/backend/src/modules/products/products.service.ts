import { TtlCache } from "../../lib/ttlCache";
import { getClientForStore } from "../stores/stores.service";

export interface TiendanubeProductImage {
  id: number;
  src: string;
  position: number;
}

export interface TiendanubeProduct {
  id: number;
  name: Record<string, string> | string;
  images: TiendanubeProductImage[];
  variants?: Array<{ id: number; price: string; stock: number | null }>;
}

const productListCache = new TtlCache<{ products: TiendanubeProduct[]; totalCount: number }>(30_000);
const productDetailCache = new TtlCache<TiendanubeProduct>(30_000);

export interface ListProductsParams {
  page?: number;
  perPage?: number;
  q?: string;
}

export async function listProducts(storeId: string, params: ListProductsParams) {
  const cacheKey = `${storeId}:${params.page ?? 1}:${params.perPage ?? 20}:${params.q ?? ""}`;
  const cached = productListCache.get(cacheKey);
  if (cached) return cached;

  const { client } = await getClientForStore(storeId);
  const products = await client.get<TiendanubeProduct[]>("/products", {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
    q: params.q,
  });

  const result = { products, totalCount: products.length };
  productListCache.set(cacheKey, result);
  return result;
}

export async function getProduct(storeId: string, productId: string): Promise<TiendanubeProduct> {
  const cacheKey = `${storeId}:${productId}`;
  const cached = productDetailCache.get(cacheKey);
  if (cached) return cached;

  const { client } = await getClientForStore(storeId);
  const product = await client.get<TiendanubeProduct>(`/products/${productId}`);
  productDetailCache.set(cacheKey, product);
  return product;
}

export function invalidateProductsCache(storeId: string) {
  productListCache.invalidatePrefix(storeId);
  productDetailCache.invalidatePrefix(storeId);
}
