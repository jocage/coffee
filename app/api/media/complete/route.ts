import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { ensureCurrentIdentity } from "@/lib/data/repositories";

const completeSchema = z.object({
  assetId: z.string().uuid(),
  storageKey: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = completeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid completion request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const ownerId = await ensureCurrentIdentity();
  const [asset] = await db
    .update(mediaAssets)
    .set({
      status: "ready",
      updatedAt: new Date()
    })
    .where(
      and(
        eq(mediaAssets.id, parsed.data.assetId),
        eq(mediaAssets.ownerId, ownerId),
        eq(mediaAssets.storageKey, parsed.data.storageKey)
      )
    )
    .returning();

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: asset.id,
    storageKey: asset.storageKey,
    status: asset.status,
    publicUrl: asset.publicUrl
  });
}
