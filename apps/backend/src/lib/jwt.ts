import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface StoreTokenPayload {
  kind: "store";
  storeId: string;
  tnStoreId: string;
  /// Presente solo cuando la sesión es de una cuenta de equipo (login email/password),
  /// no del dueño que entró por OAuth de Tiendanube. Sirve para "cambiar mi contraseña".
  teamUserId?: string;
}

export interface UserTokenPayload {
  kind: "user";
  userId: string;
  role: "ADMIN" | "VIEWER";
}

export type TokenPayload = StoreTokenPayload | UserTokenPayload;

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
