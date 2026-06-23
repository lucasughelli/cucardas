import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface StoreTokenPayload {
  kind: "store";
  storeId: string;
  tnStoreId: string;
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
