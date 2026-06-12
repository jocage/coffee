import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { getNotifications } from "@/lib/data/queries";
import { markNotificationsReadAction } from "@/lib/server-actions/community";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ read?: string }> }) {
  const params = await searchParams;
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Follows, comments, saved recipes, challenges and system updates.</p>
      </div>
      {params.read ? (
        <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-[var(--olive)]">
          Notifications marked as read.
        </p>
      ) : null}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Latest {unreadCount > 0 ? `(${unreadCount} unread)` : ""}</CardTitle>
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm" disabled={notifications.length === 0}>Mark all read</Button>
          </form>
        </div>
        <div className="mt-4 grid gap-2">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className={`focus-ring flex gap-3 rounded-[var(--radius-sm)] p-3 ${notification.readAt ? "bg-white/5 opacity-75" : "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/25"}`}
            >
              {notification.actor ? (
                <Avatar src={notification.actor.avatarUrl} alt={notification.actor.displayName} size="sm" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Bell className="h-4 w-4" aria-hidden />
                </span>
              )}
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {notification.title}
                  {!notification.readAt ? <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-black">New</span> : null}
                </span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">{notification.body}</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
