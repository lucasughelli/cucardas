import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("app wiring", () => {
  it("GET /health responde 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/designs sin token responde 401", async () => {
    const res = await request(app).get("/api/designs");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stores con token inválido responde 401", async () => {
    const res = await request(app).get("/api/admin/stores").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("POST /webhooks/tiendanube sin firma responde 401", async () => {
    const res = await request(app).post("/webhooks/tiendanube").send({ store_id: "1", event: "app/uninstalled" });
    expect(res.status).toBe(401);
  });

  it("ruta inexistente responde 404", async () => {
    const res = await request(app).get("/esto-no-existe");
    expect(res.status).toBe(404);
  });
});
