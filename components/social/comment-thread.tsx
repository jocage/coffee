import { Flag, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import type { Comment, SocialTargetType } from "@/lib/domain";
import { commentAction, deleteCommentAction, reportContentAction } from "@/lib/server-actions/social";

export function CommentThread({
  comments,
  targetType,
  targetId,
  path,
  label = "Recipe comment"
}: {
  comments: Comment[];
  targetType: SocialTargetType;
  targetId: string;
  path: string;
  label?: string;
}) {
  const topLevel = comments.filter((comment) => !comment.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  comments
    .filter((comment) => comment.parentId)
    .forEach((comment) => {
      const parentId = comment.parentId ?? "";
      repliesByParent.set(parentId, [...(repliesByParent.get(parentId) ?? []), comment]);
    });

  return (
    <>
      <CardTitle>Ask or comment</CardTitle>
      <CommentForm targetType={targetType} targetId={targetId} path={path} label={label} buttonLabel="Post comment" />
      <div className="mt-5 grid gap-3">
        {topLevel.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No comments yet.</p>
        ) : (
          topLevel.map((comment) => (
            <article key={comment.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3">
              <CommentBody comment={comment} path={path} />
              <div className="mt-3 grid gap-3 border-l border-[var(--border)] pl-3">
                {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                  <article key={reply.id} className="rounded-[var(--radius-sm)] bg-black/15 p-3">
                    <CommentBody comment={reply} path={path} />
                  </article>
                ))}
                <CommentForm
                  targetType={targetType}
                  targetId={targetId}
                  parentId={comment.id}
                  path={path}
                  label={`Reply to ${comment.author.displayName}`}
                  buttonLabel="Reply"
                  compact
                />
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}

function CommentBody({ comment, path }: { comment: Comment; path: string }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size="sm" />
        <div>
          <p className="text-sm font-semibold">{comment.author.displayName}</p>
          <p className="text-xs text-[var(--text-dim)]">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(comment.createdAt))}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{comment.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={deleteCommentAction}>
          <input type="hidden" name="id" value={comment.id} />
          <input type="hidden" name="path" value={path} />
          <Button type="submit" variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />}>Delete</Button>
        </form>
        <form action={reportContentAction}>
          <input type="hidden" name="targetType" value="comment" />
          <input type="hidden" name="targetId" value={comment.id} />
          <input type="hidden" name="path" value={path} />
          <input type="hidden" name="reason" value="other" />
          <input type="hidden" name="details" value={`Reported comment: ${comment.body.slice(0, 140)}`} />
          <Button type="submit" variant="secondary" size="sm" icon={<Flag className="h-4 w-4" aria-hidden />}>Report comment</Button>
        </form>
      </div>
    </>
  );
}

function CommentForm({
  targetType,
  targetId,
  parentId,
  path,
  label,
  buttonLabel,
  compact = false
}: {
  targetType: SocialTargetType;
  targetId: string;
  parentId?: string;
  path: string;
  label: string;
  buttonLabel: string;
  compact?: boolean;
}) {
  return (
    <form action={commentAction} className={compact ? "grid gap-2" : "mt-4 grid gap-3"}>
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="path" value={path} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea
        name="body"
        aria-label={label}
        className="focus-ring min-h-24 rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20 p-3 text-sm"
        placeholder={parentId ? "Write a reply..." : "Ask about grind, water, or tasting notes..."}
      />
      <Button type="submit" size={compact ? "sm" : "md"}>{buttonLabel}</Button>
    </form>
  );
}
