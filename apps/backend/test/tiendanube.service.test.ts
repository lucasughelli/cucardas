import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/tiendanubeClient", () => ({
  tiendanubeAuthClient: { post: vi.fn() },
  TiendanubeApiClient: vi.fn(),
}));

import { tiendanubeAuthClient } from "../src/lib/tiendanubeClient";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  extractStoreName,
} from "../src/modules/auth/tiendanube.service";

describe("buildAuthorizeUrl", () => {
  it("usa TN_CLIENT_ID para construir la URL de autorización", () => {
    expect(buildAuthorizeUrl()).toBe("https://www.tiendanube.com/apps/test-client-id/authorize");
  });
});

describe("extractStoreName", () => {
  it("devuelve el string directo cuando name ya es string", () => {
    expect(extractStoreName({ id: 1, name: "Mi Tienda" })).toBe("Mi Tienda");
  });

  it("prioriza es > pt > en > el primer valor disponible", () => {
    expect(extractStoreName({ id: 1, name: { en: "Shop", pt: "Loja", es: "Tienda" } })).toBe("Tienda");
    expect(extractStoreName({ id: 1, name: { en: "Shop", pt: "Loja" } })).toBe("Loja");
    expect(extractStoreName({ id: 1, name: { en: "Shop" } })).toBe("Shop");
    expect(extractStoreName({ id: 1, name: { fr: "Magasin" } })).toBe("Magasin");
  });

  it("devuelve undefined si no hay name", () => {
    expect(extractStoreName({ id: 1 })).toBeUndefined();
  });
});

describe("exchangeCodeForToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("intercambia el code por un token con client_id/secret y devuelve la respuesta", async () => {
    const mockResponse = { access_token: "abc123", token_type: "bearer", scope: "read_products", user_id: 999 };
    vi.mocked(tiendanubeAuthClient.post).mockResolvedValue({ data: mockResponse });

    const result = await exchangeCodeForToken("the-auth-code");

    expect(tiendanubeAuthClient.post).toHaveBeenCalledWith("/apps/authorize/token", {
      client_id: "test-client-id",
      client_secret: "test-client-secret",
      grant_type: "authorization_code",
      code: "the-auth-code",
    });
    expect(result).toEqual(mockResponse);
  });

  it("propaga el error si Tiendanube rechaza el code", async () => {
    vi.mocked(tiendanubeAuthClient.post).mockRejectedValue(new Error("invalid_grant"));
    await expect(exchangeCodeForToken("bad-code")).rejects.toThrow("invalid_grant");
  });
});
