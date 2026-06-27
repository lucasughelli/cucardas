import { describe, it, expect, beforeEach } from "vitest";
import { logEvent, getDesignAnalytics } from "./analytics.service";
import { prisma } from "../../lib/prisma";

describe("Analytics Service", () => {
  beforeEach(async () => {
    // Cleanup
    await prisma.cucardaEvent.deleteMany({});
  });

  it("should log an event", async () => {
    await logEvent("test-store-123", "product-1", "design-1", "impression");
    const events = await prisma.cucardaEvent.findMany();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("impression");
  });

  it("should calculate CTR correctly", async () => {
    const storeId = "test-store-456";
    const store = await prisma.store.create({
      data: { tnStoreId: storeId, accessTokenEnc: "dummy" },
    });
    const design = await prisma.design.create({
      data: { storeId: store.id, name: "Test", type: "TEXT" },
    });

    // 10 impressions, 5 clicks
    for (let i = 0; i < 10; i++) {
      await prisma.cucardaEvent.create({
        data: {
          storeId: store.id,
          productId: "p1",
          designId: design.id,
          type: "impression",
        },
      });
    }
    for (let i = 0; i < 5; i++) {
      await prisma.cucardaEvent.create({
        data: {
          storeId: store.id,
          productId: "p1",
          designId: design.id,
          type: "click",
        },
      });
    }

    const stats = await getDesignAnalytics(store.id, design.id, new Date(0), new Date());
    expect(stats?.ctr).toBe(50); // 5/10 = 50%
    expect(stats?.impressions).toBe(10);
    expect(stats?.clicks).toBe(5);
  });
});
