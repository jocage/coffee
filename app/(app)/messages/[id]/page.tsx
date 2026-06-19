import { notFound } from "next/navigation";
import { Ban, Flag, Link as LinkIcon, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { getConversationDetailById, getCurrentUser, getMyRecipes } from "@/lib/data/queries";
import { blockConversationAction } from "@/lib/server-actions/community";
import { reportContentAction } from "@/lib/server-actions/social";
import type { ConversationMessage } from "@/lib/domain";

export default async function ConversationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ blocked?: string; error?: string; reported?: string; sent?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  const [detail, recipes, currentUser] = await Promise.all([
    getConversationDetailById(id),
    getMyRecipes({ visibility: "all" }),
    getCurrentUser()
  ]);

  if (!detail) {
    notFound();
  }

  const { conversation, messages, canSend, isBlocked } = detail;

  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-5 pb-32 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-5">
      <section className="grid min-w-0 gap-5">
      <div className="flex items-center gap-3">
        <Avatar src={conversation.participant.avatarUrl} alt={conversation.participant.displayName} size="md" />
        <div>
          <h1 className="text-2xl font-bold">{conversation.participant.displayName}</h1>
          <p className="text-sm text-[var(--text-muted)]">@{conversation.participant.handle}</p>
        </div>
        {isBlocked ? <Badge>Blocked</Badge> : null}
      </div>
      <Card className="grid min-h-[420px] content-between gap-5">
        <div className="grid gap-3">
          {messages.map((message) => (
            <Bubble
              key={message.id}
              message={message}
              align={message.sender.handle === currentUser.handle ? "right" : "left"}
            />
          ))}
        </div>
        {flags.sent === "1" ? <p className="text-sm text-[var(--success)]">Message sent.</p> : null}
        {flags.error ? <p className="text-sm text-[var(--danger)]">Message could not be sent.</p> : null}
        {canSend ? (
          <form action={`/messages/${conversation.id}/send`} method="post" className="grid gap-3">
            <Input name="body" placeholder="Write a message..." aria-label="Write a message" required />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--text-muted)]">Attach recipe</span>
                <Select name="recipeId" defaultValue="" aria-label="Attach recipe">
                  <option value="">No recipe attachment</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </Select>
              </label>
              <Button type="submit" className="self-end" icon={<Send className="h-4 w-4" aria-hidden />}>
                Send
              </Button>
            </div>
          </form>
        ) : (
          <p className="rounded-[var(--radius-sm)] bg-white/5 p-3 text-sm text-[var(--text-muted)]">
            Messaging is disabled for this conversation.
          </p>
        )}
      </Card>
      </section>

      <aside className="grid min-w-0 content-start gap-5">
        <Card>
          <CardTitle>Conversation tools</CardTitle>
          {flags.reported === "1" ? <p className="mt-3 text-sm text-[var(--success)]">Report submitted.</p> : null}
          {flags.blocked === "1" ? <p className="mt-3 text-sm text-[var(--success)]">Conversation blocked.</p> : null}
          <form action={reportContentAction} className="mt-4 grid gap-3">
            <input type="hidden" name="targetType" value="conversation" />
            <input type="hidden" name="targetId" value={conversation.id} />
            <input type="hidden" name="path" value={`/messages/${conversation.id}`} />
            <div>
              <Label htmlFor="reason">Report reason</Label>
              <Select id="reason" name="reason" defaultValue="spam">
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="unsafe">Unsafe</option>
                <option value="copyright">Copyright</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <Textarea name="details" aria-label="Report details" placeholder="Add context for moderators." />
            <Button type="submit" variant="secondary" icon={<Flag className="h-4 w-4" aria-hidden />}>
              Report conversation
            </Button>
          </form>
          <form action={blockConversationAction} className="mt-3">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <input type="hidden" name="path" value={`/messages/${conversation.id}`} />
            <Button type="submit" variant="danger" className="w-full" icon={<Ban className="h-4 w-4" aria-hidden />} disabled={isBlocked}>
              Block conversation
            </Button>
          </form>
        </Card>
      </aside>
    </div>
  );
}

function Bubble({ message, align }: { message: ConversationMessage; align: "left" | "right" }) {
  return (
    <article
      className={
        align === "right"
          ? "ml-auto max-w-[82%] rounded-[var(--radius-sm)] bg-[var(--accent)] p-3 text-sm text-black"
          : "max-w-[82%] rounded-[var(--radius-sm)] bg-white/8 p-3 text-sm"
      }
    >
      <p>{message.body}</p>
      {message.recipe ? (
        <a
          href={`/r/${message.recipe.author.handle}/${message.recipe.slug}`}
          className={align === "right" ? "mt-2 inline-flex items-center gap-1 text-xs text-black/75" : "mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)]"}
        >
          <LinkIcon className="h-3.5 w-3.5" aria-hidden />
          {message.recipe.title}
        </a>
      ) : null}
    </article>
  );
}
