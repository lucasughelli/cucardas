import axios from "axios";
import { describe, expect, it, vi } from "vitest";

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return { ...actual, default: { ...actual.default, create: vi.fn() } };
});

import { TiendanubeApiClient } from "../src/lib/tiendanubeClient";

function mockAxiosInstance() {
  const request = vi.fn();
  vi.mocked(axios.create).mockReturnValue({ request } as never);
  return request;
}

function rateLimitError(retryAfter: string) {
  return Object.assign(new Error("Too Many Requests"), {
    isAxiosError: true,
    response: { status: 429, headers: { "retry-after": retryAfter } },
  });
}

function uniqueStoreId() {
  return `store-${Math.random().toString(36).slice(2)}`;
}

describe("TiendanubeApiClient retry/rate-limit", () => {
  it("reintenta una vez ante 429 respetando Retry-After y devuelve el resultado final", async () => {
    const request = mockAxiosInstance();
    request.mockRejectedValueOnce(rateLimitError("0.05")).mockResolvedValueOnce({ data: { ok: true } });

    const client = new TiendanubeApiClient("token", uniqueStoreId());
    const result = await client.get<{ ok: boolean }>("/store");

    expect(result).toEqual({ ok: true });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("abandona después de agotar los reintentos y propaga el error", async () => {
    const request = mockAxiosInstance();
    const err = rateLimitError("0.05");
    request.mockRejectedValue(err);

    const client = new TiendanubeApiClient("token", uniqueStoreId());
    await expect(client.get("/store")).rejects.toBe(err);

    // intento inicial + 3 reintentos = 4 llamadas
    expect(request).toHaveBeenCalledTimes(4);
  });

  it("no reintenta ante errores que no son 429", async () => {
    const request = mockAxiosInstance();
    const notFound = Object.assign(new Error("Not Found"), {
      isAxiosError: true,
      response: { status: 404, headers: {} },
    });
    request.mockRejectedValue(notFound);

    const client = new TiendanubeApiClient("token", uniqueStoreId());
    await expect(client.get("/store")).rejects.toBe(notFound);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("envía el header Authentication (no Authorization) con scheme bearer", async () => {
    mockAxiosInstance();
    new TiendanubeApiClient("my-access-token", uniqueStoreId());

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authentication: "bearer my-access-token" }),
      }),
    );
  });
});
