import type { NextFunction, Request, Response } from "express";
import { verifyToken, type StoreTokenPayload, type UserTokenPayload } from "../lib/jwt";
import { HttpError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      store?: StoreTokenPayload;
      user?: UserTokenPayload;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function requireStoreAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) return next(new HttpError(401, "Falta el token de sesión"));

  try {
    const payload = verifyToken(token);
    if (payload.kind !== "store") throw new Error("Tipo de token incorrecto");
    req.store = payload;
    next();
  } catch {
    next(new HttpError(401, "Token de sesión inválido o expirado"));
  }
}

export function requireAdminAuth(allowedRoles?: Array<UserTokenPayload["role"]>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) return next(new HttpError(401, "Falta el token de sesión"));

    try {
      const payload = verifyToken(token);
      if (payload.kind !== "user") throw new Error("Tipo de token incorrecto");
      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return next(new HttpError(403, "No tenés permisos para esta acción"));
      }
      req.user = payload;
      next();
    } catch {
      next(new HttpError(401, "Token de sesión inválido o expirado"));
    }
  };
}
