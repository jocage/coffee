import { notFound } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { getConversationById } from "@/lib/data/queries";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversationById(id);

  if (!conversation) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 py-5 pb-32 md:px-6 lg:pb-5">
      <div className="flex items-center gap-3">
        <Avatar
          src={conversation.participant.avatarUrl}
          alt={conversation.participant.displayName}
          size="md"
        />
        <div>
          <h1 className="text-2xl font-bold">{conversation.participant.displayName}</h1>
          <p className="text-sm text-[var(--text-muted)]">@{conversation.participant.handle}</p>
        </div>
      </div>
      <Card className="grid min-h-[420px] content-between gap-5">
        <div className="grid gap-3">
          {conversation.messages.map((message) => (
            <Bubble
              key={message.id}
              align={message.senderId === conversation.participant.id ? "left" : "right"}
              body={message.body}
            />
          ))}
        </div>
        <form
          action={`/messages/${conversation.id}/send`}
          method="post"
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
        >
          <Input name="body" placeholder="Write a message..." aria-label="Write a message" />
          <Button type="submit" icon={<Send className="h-4 w-4" aria-hidden />}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Bubble({ body, align }: { body: string; align: "left" | "right" }) {
  return (
    <p
      className={
        align === "right"
          ? "ml-auto max-w-[82%] rounded-[var(--radius-sm)] bg-[var(--accent)] p-3 text-sm text-black"
          : "max-w-[82%] rounded-[var(--radius-sm)] bg-white/8 p-3 text-sm"
      }
    >
      {body}
    </p>
  );
}
