import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { ensureCurrentIdentity } from "@/lib/data/repositories";
import { createPresignedUpload } from "@/lib/media/storage";
import { presignUploadSchema } from "@/lib/validators/media";

export async function POST(request: Request) {
  const parsed = presignUploadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const ownerId = await ensureCurrentIdentity();
  const upload = await createPresignedUpload({
    ownerId,
    fileName: parsed.data.fileName,
    mimeType: parsed.data.mimeType,
    entityType: parsed.data.entityType
  });

  await db.insert(mediaAssets).values({
    id: upload.assetId,
    ownerId,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    fileName: parsed.data.fileName,
    mimeType: parsed.data.mimeType,
    size: parsed.data.size,
    storageKey: upload.storageKey,
    publicUrl: upload.publicUrl,
    status: "pending"
  });

  return NextResponse.json(upload);
}
