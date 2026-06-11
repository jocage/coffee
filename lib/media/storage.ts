import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

export function getStorageConfig(): StorageConfig | null {
  const accountEndpoint = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT ?? accountEndpoint ?? process.env.S3_ENDPOINT;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? process.env.S3_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY;

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
