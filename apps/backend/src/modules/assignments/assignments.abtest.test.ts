import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma";

describe("A/B Testing", () => {
  let storeId: string;

  beforeEach(async () => {
    const store = await prisma.store.create({
      data: { tnStoreId: `test-${Date.now()}`, accessTokenEnc: "dummy" },
    });
    storeId = store.id;
  });

  it("should create assignments with variants", async () => {
    const design1 = await prisma.design.create({
      data: { storeId, name: "Design A", type: "TEXT" },
    });
    const design2 = await prisma.design.create({
      data: { storeId, name: "Design B", type: "TEXT" },
    });

    // Variant A
    await prisma.assignment.create({
      data: {
        storeId,
        productId: "product-1",
        designId: design1.id,
        variant: "VARIANT_A",
        weight: 50,
      },
    });

    // Variant B
    await prisma.assignment.create({
      data: {
        storeId,
        productId: "product-1",
        designId: design2.id,
        variant: "VARIANT_B",
        weight: 50,
      },
    });

    const assignments = await prisma.assignment.findMany({
      where: { storeId, productId: "product-1" },
    });

    expect(assignments).toHaveLength(2);
    expect(assignments[0].variant).toBe("VARIANT_A");
    expect(assignments[1].variant).toBe("VARIANT_B");
    expect(assignments[0].weight).toBe(50);
    expect(assignments[1].weight).toBe(50);
  });
});
