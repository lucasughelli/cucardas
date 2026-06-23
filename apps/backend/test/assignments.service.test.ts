import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    design: { findFirst: vi.fn() },
    assignment: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  },
}));

import { prisma } from "../src/lib/prisma";
import { HttpError } from "../src/middleware/errorHandler";
import { createAssignments, deleteAssignment, setAssignmentActive } from "../src/modules/assignments/assignments.service";

const STORE_ID = "store-1";
const DESIGN_ID = "design-1";

describe("createAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si el diseño no pertenece a la tienda (aislamiento de tenant)", async () => {
    vi.mocked(prisma.design.findFirst).mockResolvedValue(null);

    await expect(
      createAssignments(STORE_ID, { designId: DESIGN_ID, productIds: ["p1"] }),
    ).rejects.toThrow(HttpError);

    expect(prisma.assignment.create).not.toHaveBeenCalled();
  });

  it("crea una asignación por cada producto nuevo y registra un audit log", async () => {
    vi.mocked(prisma.design.findFirst).mockResolvedValue({ id: DESIGN_ID, storeId: STORE_ID } as never);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.assignment.create).mockImplementation(
      ({ data }) => Promise.resolve({ id: `assignment-${data.productId}`, ...data }) as never,
    );

    const result = await createAssignments(STORE_ID, {
      designId: DESIGN_ID,
      productIds: ["p1", "p2", "p3"],
    });

    expect(result).toHaveLength(3);
    expect(prisma.assignment.create).toHaveBeenCalledTimes(3);
    expect(prisma.assignment.create).toHaveBeenCalledWith({
      data: { storeId: STORE_ID, designId: DESIGN_ID, productId: "p1", active: true },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        storeId: STORE_ID,
        action: "assignment.created",
        entityType: "assignment",
        metadata: { designId: DESIGN_ID, productIds: ["p1", "p2", "p3"] },
      },
    });
  });

  it("no duplica asignaciones para productos que ya tienen la cucarda", async () => {
    vi.mocked(prisma.design.findFirst).mockResolvedValue({ id: DESIGN_ID, storeId: STORE_ID } as never);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([{ productId: "p1" }] as never);
    vi.mocked(prisma.assignment.create).mockImplementation(
      ({ data }) => Promise.resolve({ id: `assignment-${data.productId}`, ...data }) as never,
    );

    const result = await createAssignments(STORE_ID, { designId: DESIGN_ID, productIds: ["p1", "p2"] });

    expect(result).toHaveLength(1);
    expect(prisma.assignment.create).toHaveBeenCalledTimes(1);
    expect(prisma.assignment.create).toHaveBeenCalledWith({
      data: { storeId: STORE_ID, designId: DESIGN_ID, productId: "p2", active: true },
    });
  });
});

describe("setAssignmentActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si la asignación no existe o no pertenece a la tienda", async () => {
    vi.mocked(prisma.assignment.findFirst).mockResolvedValue(null);
    await expect(setAssignmentActive(STORE_ID, "missing", false)).rejects.toThrow(HttpError);
    expect(prisma.assignment.update).not.toHaveBeenCalled();
  });

  it("desactiva una asignación existente y registra el audit log correspondiente", async () => {
    vi.mocked(prisma.assignment.findFirst).mockResolvedValue({ id: "a1", storeId: STORE_ID } as never);
    vi.mocked(prisma.assignment.update).mockResolvedValue({ id: "a1", active: false } as never);

    const result = await setAssignmentActive(STORE_ID, "a1", false);

    expect(result.active).toBe(false);
    expect(prisma.assignment.update).toHaveBeenCalledWith({ where: { id: "a1" }, data: { active: false } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: { storeId: STORE_ID, action: "assignment.deactivated", entityType: "assignment", entityId: "a1" },
    });
  });
});

describe("deleteAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si la asignación no existe o no pertenece a la tienda", async () => {
    vi.mocked(prisma.assignment.findFirst).mockResolvedValue(null);
    await expect(deleteAssignment(STORE_ID, "missing")).rejects.toThrow(HttpError);
    expect(prisma.assignment.delete).not.toHaveBeenCalled();
  });

  it("borra la asignación y registra el audit log", async () => {
    vi.mocked(prisma.assignment.findFirst).mockResolvedValue({ id: "a1", storeId: STORE_ID } as never);

    await deleteAssignment(STORE_ID, "a1");

    expect(prisma.assignment.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: { storeId: STORE_ID, action: "assignment.deleted", entityType: "assignment", entityId: "a1" },
    });
  });
});
