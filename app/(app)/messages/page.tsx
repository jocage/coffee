import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/form";
import { getConversations, getCurrentUser, getProfiles } from "@/lib/data/queries";
import { startConversationAction } from "@/lib/server-actions/community";

export default async function MessagesPage() {
  const [conversations, currentUser, profiles] = await Promise.all([
    getConversations(),
    getCurrentUser(),
    getProfiles()
  ]);
  const recipients = profiles.filter((profile) => profile.id !== currentUser.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Direct conversations with creators and club members.
        </p>
      </div>
      <Card className="mb-4">
        <CardTitle>New message</CardTitle>
        <form
          action={startConversationAction}
          className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]"
        >
          <div>
            <Label htmlFor="recipientId">Recipient</Label>
            <Select id="recipientId" name="recipientId" disabled={recipients.length === 0} required>
              {recipients.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" rows={2} placeholder="Write a message..." required />
          </div>
          <Button
            type="submit"
            className="self-end"
            disabled={recipients.length === 0}
            icon={<Send className="h-4 w-4" aria-hidden />}
          >
            Send
          </Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Inbox</CardTitle>
        <div className="mt-4 grid gap-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="focus-ring flex items-center gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3"
            >
              <Avatar
                src={conversation.participant.avatarUrl}
                alt={conversation.participant.displayName}
                size="sm"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {conversation.participant.displayName}
                </span>
                <span className="block truncate text-xs text-[var(--text-muted)]">
                  {conversation.lastMessage}
                </span>
              </span>
              {conversation.unreadCount > 0 ? (
                <Badge>{conversation.unreadCount}</Badge>
              ) : (
                <MessageCircle className="h-4 w-4 text-[var(--text-dim)]" aria-hidden />
              )}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
