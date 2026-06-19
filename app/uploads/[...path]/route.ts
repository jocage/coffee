import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { AuthRequiredError, ensureCurrentIdentity } from "@/lib/data/repositories";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic"
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: requestedPath } = await params;
  const storageKey = path.normalize(requestedPath.join("/")).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  let ownerId: string;

  try {
    ownerId = await ensureCurrentIdentity();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }

  const asset = await db.query.mediaAssets.findFirst({
    where: and(eq(mediaAssets.ownerId, ownerId), eq(mediaAssets.storageKey, storageKey), eq(mediaAssets.status, "ready"))
  });

  if (!asset) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  const uploadRoot = process.env.LOCAL_UPLOAD_DIR ?? ".local/uploads";
  const filePath = path.join(/* turbopackIgnore: true */ uploadRoot, storageKey);

  try {
    const bytes = await readFile(/* turbopackIgnore: true */ filePath);
    const extension = path.extname(filePath).toLowerCase();

    return new NextResponse(bytes, {
      headers: {
        "content-type": contentTypes[extension] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }
}
