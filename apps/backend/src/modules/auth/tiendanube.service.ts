import { env } from "../../config/env";
import { TiendanubeApiClient, tiendanubeAuthClient } from "../../lib/tiendanubeClient";

export interface TiendanubeTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  /** A pesar del nombre, este es el ID numérico de la tienda (store_id), no de un usuario. */
  user_id: number;
}

export interface TiendanubeStoreInfo {
  id: number;
  name?: Record<string, string> | string;
  email?: string;
}

export function buildAuthorizeUrl(): string {
  return `https://www.tiendanube.com/apps/${env.TN_CLIENT_ID}/authorize`;
}

export async function exchangeCodeForToken(code: string): Promise<TiendanubeTokenResponse> {
  const { data } = await tiendanubeAuthClient.post<TiendanubeTokenResponse>("/apps/authorize/token", {
    client_id: env.TN_CLIENT_ID,
    client_secret: env.TN_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
  });
  return data;
}

export async function fetchStoreInfo(accessToken: string, tnStoreId: string): Promise<TiendanubeStoreInfo> {
  const client = new TiendanubeApiClient(accessToken, tnStoreId);
  return client.get<TiendanubeStoreInfo>("/store");
}

export function extractStoreName(info: TiendanubeStoreInfo): string | undefined {
  if (!info.name) return undefined;
  if (typeof info.name === "string") return info.name;
  return info.name.es ?? info.name.pt ?? info.name.en ?? Object.values(info.name)[0];
}
