import Link from "next/link";
import { ArrowRight, Bell, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getCommunityOverview } from "@/lib/data/queries";

export default async function CommunityPage() {
  const { clubs, challenges, notifications } = await getCommunityOverview();

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Join clubs, enter challenges and keep up with coffee people.</p>
          </div>
          <Link href="/clubs">
            <Button icon={<Users className="h-4 w-4" aria-hidden />}>Browse clubs</Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {clubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.slug}`} className="focus-ring rounded-[var(--radius-md)]">
              <Card className="h-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <CardTitle>{club.name}</CardTitle>
                  <Badge>{club.memberCount.toLocaleString()} members</Badge>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{club.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                  Open club <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <aside className="grid content-start gap-5">
        <Card>
          <CardTitle>Active challenges</CardTitle>
          <div className="mt-4 grid gap-3">
            {challenges.map((challenge) => (
              <Link key={challenge.id} href={`/challenges/${challenge.id}`} className="focus-ring rounded-[var(--radius-sm)] bg-white/5 p-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                  {challenge.title}
                </span>
                <span className="mt-1 block text-xs text-[var(--text-dim)]">{challenge.entryCount} entries</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Notifications</CardTitle>
          <div className="mt-4 grid gap-3">
            {notifications.map((notification) => (
              <Link key={notification.id} href={notification.href} className="focus-ring rounded-[var(--radius-sm)] bg-white/5 p-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Bell className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                  {notification.title}
                </span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">{notification.body}</span>
              </Link>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
