import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sendMessageInDb } from "@/lib/data/repositories";
import { sendMessageInputSchema } from "@/lib/validators/community";

export async function POST(request: NextRequest, { params }: { params: Promise<unknown> }) {
  const { id } = (await params) as { id: string };
  const formData = await request.formData();
  const parsed = sendMessageInputSchema.safeParse({
    conversationId: id,
    body: formData.get("body"),
    recipeId: formData.get("recipeId"),
    path: `/messages/${id}`
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/messages/${id}?error=message`, request.url), 303);
  }

  try {
    await sendMessageInDb(parsed.data);
    revalidatePath("/messages");
    revalidatePath(`/messages/${id}`);
  } catch {
    return NextResponse.redirect(new URL(`/messages/${id}?error=permission`, request.url), 303);
  }

  return NextResponse.redirect(new URL(`/messages/${id}?sent=1`, request.url), 303);
}
