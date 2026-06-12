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
    path: `/messages/${id}`
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/messages/${id}?error=message`, request.url), 303);
  }

  await sendMessageInDb(parsed.data);
  revalidatePath("/messages");
  revalidatePath(`/messages/${id}`);

  return NextResponse.redirect(new URL(`/messages/${id}?sent=1`, request.url), 303);
}
