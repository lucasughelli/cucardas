import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";

/** El almacenamiento de imágenes es opcional: solo se necesita para cucardas de imagen. */
export function isStorageConfigured(): boolean {
  return Boolean(
    env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY && env.S3_BUCKET && env.S3_PUBLIC_URL,
  );
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new HttpError(
      503,
      "El almacenamiento de imágenes no está configurado. Configurá las variables S3_* para subir imágenes (las cucardas de texto no lo necesitan).",
    );
  }
  if (!_client) {
    _client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY as string,
        secretAccessKey: env.S3_SECRET_KEY as string,
      },
    });
  }
  return _client;
}

export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${env.S3_PUBLIC_URL}/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp|svg\+xml));base64,(.+)$/;

export function parseImageDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; extension: string } {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de imagen inválido: se espera un data URL base64 (png/jpeg/webp/svg)");
  }
  const [, contentType, base64] = match;
  const extension = contentType.split("/")[1].replace("svg+xml", "svg");
  return { buffer: Buffer.from(base64, "base64"), contentType, extension };
}
