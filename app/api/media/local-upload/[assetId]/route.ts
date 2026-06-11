import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { ensureCurrentIdentity } from "@/lib/data/repositories";

export async function PUT(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const url = new URL(request.url);
  const storageKey = url.searchParams.get("storageKey") ?? assetId;
  const normalizedStorageKey = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
  const ownerId = await ensureCurrentIdentity();
  const asset = await db.query.mediaAssets.findFirst({
    where: and(
      eq(mediaAssets.id, assetId),
      eq(mediaAssets.ownerId, ownerId),
      eq(mediaAssets.storageKey, normalizedStorageKey),
      eq(mediaAssets.status, "pending")
    )
  });

  if (!asset) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  const dir = path.join(/* turbopackIgnore: true */ process.cwd(), ".local", "uploads");
  const destination = path.join(dir, normalizedStorageKey);

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);

  return NextResponse.json({ id: assetId, status: "uploaded" });
}
