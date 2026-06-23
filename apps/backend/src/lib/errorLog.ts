import type { Prisma } from "@prisma/client";
import { logger } from "./logger";
import { prisma } from "./prisma";

export interface ErrorLogInput {
  storeId?: string;
  level?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  source: "FRONTEND" | "BACKEND" | "API";
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

/** Nunca lanza: si falla la persistencia, lo dejamos en el logger de proceso y seguimos. */
export async function persistErrorLog(input: ErrorLogInput): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        storeId: input.storeId,
        level: input.level ?? "ERROR",
        source: input.source,
        message: input.message,
        stack: input.stack,
        context: input.context as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error({ err, originalMessage: input.message }, "No se pudo persistir el error en error_logs");
  }
}
