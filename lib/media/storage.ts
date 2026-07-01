import { stat } from "node:fs/promises";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type PresignedUpload = {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
  headers: Record<string, string>;
  publicUrl?: string;
};

type StorageConfig = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
};

export async function createPresignedUpload(input: {
  ownerId: string;
  fileName: string;
  mimeType: string;
  entityType: string;
}): Promise<PresignedUpload> {
  const assetId = crypto.randomUUID();
  const safeName = input.fileName.replace(/[^a-z0-9_.-]/gi, "-").toLowerCase();
  const storageKey = `${input.ownerId}/${input.entityType}/${assetId}-${safeName}`;
  const config = getStorageConfig();

  if (!config) {
    return {
      assetId,
      uploadUrl: `/api/media/local-upload/${assetId}?storageKey=${encodeURIComponent(storageKey)}`,
      storageKey,
      headers: { "content-type": input.mimeType },
      publicUrl: `/uploads/${storageKey}`
    };
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ContentType: input.mimeType
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

  return {
    assetId,
    uploadUrl,
    storageKey,
    headers: { "content-type": input.mimeType },
    publicUrl: config.publicBaseUrl ? `${config.publicBaseUrl}/${storageKey}` : undefined
  };
}

export async function verifyCompletedUpload(input: {
  storageKey: string;
  expectedSize?: number;
}): Promise<boolean> {
  const config = getStorageConfig();

  if (!config) {
    const normalizedStorageKey = normalizeStorageKey(input.storageKey);
    const filePath = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      ".local",
      "uploads",
      normalizedStorageKey
    );

    try {
      const stats = await stat(filePath);
      return input.expectedSize ? stats.size === input.expectedSize : stats.size > 0;
    } catch {
      return false;
    }
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });

  try {
    const result = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: input.storageKey
      })
    );

    return input.expectedSize ? result.ContentLength === input.expectedSize : true;
  } catch {
    return false;
  }
}

export function getStorageConfig(): StorageConfig | null {
  const accountEndpoint = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT ?? accountEndpoint ?? process.env.S3_ENDPOINT;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? process.env.S3_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    endpoint,
    region: process.env.CLOUDFLARE_R2_REGION ?? process.env.S3_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL ?? process.env.S3_PUBLIC_BASE_URL
  };
}

function normalizeStorageKey(storageKey: string) {
  return path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
}
