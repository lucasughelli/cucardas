declare global {
  namespace Express {
    interface Request {
      /** Buffer del body crudo, capturado por el verify hook de express.json() — necesario para validar HMAC de webhooks. */
      rawBody?: Buffer;
    }
  }
}

export {};
