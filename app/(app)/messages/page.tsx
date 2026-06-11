import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { getConversations } from "@/lib/data/queries";

export default async function MessagesPage() {
  const conversations = await getConversations();

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Direct conversations with creators and club members.</p>
      </div>
      <Card>
        <CardTitle>Inbox</CardTitle>
        <div className="mt-4 grid gap-2">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`} className="focus-ring flex items-center gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3">
              <Avatar src={conversation.participant.avatarUrl} alt={conversation.participant.displayName} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{conversation.participant.displayName}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{conversation.lastMessage}</span>
              </span>
              {conversation.unreadCount > 0 ? <Badge>{conversation.unreadCount}</Badge> : <MessageCircle className="h-4 w-4 text-[var(--text-dim)]" aria-hidden />}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
