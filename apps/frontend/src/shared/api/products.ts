import { apiClient } from "./client";

export interface TiendanubeProductImage {
  id: number;
  src: string;
  position: number;
}

export interface TiendanubeProduct {
  id: number;
  name: Record<string, string> | string;
  images: TiendanubeProductImage[];
}

export interface ListProductsResult {
  products: TiendanubeProduct[];
  totalCount: number;
}

export async function listProducts(params: { page?: number; perPage?: number; q?: string }): Promise<ListProductsResult> {
  const { data } = await apiClient.get<ListProductsResult>("/api/products", { params });
  return data;
}

export function productDisplayName(product: TiendanubeProduct): string {
  if (typeof product.name === "string") return product.name;
  return product.name.es ?? product.name.pt ?? product.name.en ?? Object.values(product.name)[0] ?? `Producto ${product.id}`;
}
