import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type Bottleneck from "bottleneck";
import { env } from "../config/env";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { getStoreLimiter } from "./rateLimiter";

const MAX_RETRY_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRawClient(accessToken: string, tnStoreId: string): AxiosInstance {
  return axios.create({
    baseURL: `${env.TN_API_BASE_URL}/${tnStoreId}`,
    headers: {
      // Tiendanube usa el header no estándar "Authentication" (no "Authorization") con scheme "bearer".
      Authentication: `bearer ${accessToken}`,
      "User-Agent": env.TN_APP_USER_AGENT,
      "Content-Type": "application/json",
    },
    timeout: 15_000,
  });
}

/**
 * Cliente para la API de Tiendanube con throttling (Bottleneck, por tienda) y retry
 * automático ante 429 respetando el header Retry-After.
 */
export class TiendanubeApiClient {
  private axios: AxiosInstance;
  private limiter: Bottleneck;
  private tnStoreId: string;

  constructor(accessToken: string, tnStoreId: string) {
    this.tnStoreId = tnStoreId;
    this.axios = buildRawClient(accessToken, tnStoreId);
    this.limiter = getStoreLimiter(tnStoreId);
  }

  async request<T>(config: AxiosRequestConfig, attempt = 1): Promise<T> {
    try {
      const response = await this.limiter.schedule(() => this.axios.request<T>(config));
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429 && attempt <= MAX_RETRY_ATTEMPTS) {
        const retryAfterSec = Number(err.response.headers["retry-after"]) || 1;
        logger.warn(
          { tnStoreId: this.tnStoreId, attempt, retryAfterSec },
          "Rate limit de Tiendanube alcanzado, reintentando",
        );
        await sleep(retryAfterSec * 1000);
        return this.request<T>(config, attempt + 1);
      }
      // 402: billing gestionado por Tiendanube — la app está suspendida por falta de pago.
      // Reflejamos el estado en la DB (red de seguridad por si no llegó el webhook app/suspended)
      // y no reintentamos: la API seguirá devolviendo 402 hasta que el comercio regularice.
      if (axios.isAxiosError(err) && err.response?.status === 402) {
        logger.warn({ tnStoreId: this.tnStoreId }, "402 de Tiendanube: app suspendida por falta de pago");
        await prisma.store
          .updateMany({ where: { tnStoreId: this.tnStoreId, uninstalledAt: null }, data: { status: "SUSPENDED" } })
          .catch(() => {});
      }
      throw err;
    }
  }

  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({ method: "GET", url: path, params });
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", url: path, data });
  }

  put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: "PUT", url: path, data });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: "DELETE", url: path });
  }
}

/** Cliente para los endpoints de autorización OAuth, que viven en www.tiendanube.com (no api.*). */
export const tiendanubeAuthClient = axios.create({
  baseURL: "https://www.tiendanube.com",
  headers: {
    "User-Agent": env.TN_APP_USER_AGENT,
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});
