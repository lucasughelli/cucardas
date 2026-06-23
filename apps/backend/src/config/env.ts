import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),

  TN_CLIENT_ID: z.string().min(1),
  // También se usa como clave para validar el HMAC de los webhooks (Tiendanube no provee
  // un secreto de webhook separado: firma con el mismo client_secret de la app).
  TN_CLIENT_SECRET: z.string().min(1),
  TN_REDIRECT_URI: z.string().url(),
  TN_API_BASE_URL: z.string().url().default("https://api.tiendanube.com/v1"),
  TN_APP_USER_AGENT: z.string().default("Cucardas App"),
  // ID del Script creado una sola vez en partners.tiendanube.com (no hay API para crearlo,
  // solo para activarlo por tienda vía POST /scripts). Opcional para no romper el arranque
  // de quien todavía no lo creó.
  TN_SCRIPT_ID: z.string().optional(),

  // Almacenamiento de imágenes (S3/MinIO/R2). OPCIONAL: si no se configura, el backend arranca
  // igual y solo se deshabilita la subida de imágenes (las cucardas de texto no necesitan storage).
  // Permite hacer el primer deploy sin tener que configurar un bucket todavía.
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().min(1).optional(),
  S3_SECRET_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_PUBLIC_URL: z.string().url().optional(),

  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "TOKEN_ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes)"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Variables de entorno inválidas o faltantes:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Configuración de entorno inválida. Revisá .env contra .env.example");
  }
  return result.data;
}

export const env = loadEnv();
export type Env = typeof env;
