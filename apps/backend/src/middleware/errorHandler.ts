import axios from "axios";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { persistErrorLog } from "../lib/errorLog";
import { logger } from "../lib/logger";

export class HttpError extends Error {
  status: number;
  context?: Record<string, unknown>;

  constructor(status: number, message: string, context?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.context = context;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "No encontrado", path: req.path });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos inválidos", issues: err.issues });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
  }

  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Error interno";
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error(
    {
      status,
      path: req.path,
      method: req.method,
      stack,
      context: err instanceof HttpError ? err.context : undefined,
    },
    message,
  );

  if (status >= 500) {
    void persistErrorLog({
      storeId: req.store?.storeId,
      source: axios.isAxiosError(err) ? "API" : "BACKEND",
      message,
      stack,
      context: { path: req.path, method: req.method, ...(err instanceof HttpError ? err.context : {}) },
    });
  }

  res.status(status).json({
    error: status >= 500 ? "Error interno del servidor" : message,
  });
}
