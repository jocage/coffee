import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/form";
import { getBrewLogs, getChallengeDetailById } from "@/lib/data/queries";
import { enterChallengeAction } from "@/lib/server-actions/community";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, brewLogs] = await Promise.all([getChallengeDetailById(id), getBrewLogs()]);

  if (!detail) {
    notFound();
  }

  const { challenge, entries, leaderboard } = detail;
  const hasBrewLogs = brewLogs.length > 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 pb-32 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-5">
      <section className="grid min-w-0 gap-5">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Challenge</CardTitle>
              <h1 className="serif mt-3 text-5xl">{challenge.title}</h1>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{challenge.description}</p>
            </div>
            <Trophy className="h-10 w-10 shrink-0 text-[var(--accent)]" aria-hidden />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Entries" value={challenge.entryCount.toLocaleString()} />
            <Metric label="Starts" value={new Date(challenge.startsAt).toLocaleDateString()} />
            <Metric label="Ends" value={new Date(challenge.endsAt).toLocaleDateString()} />
          </div>
          <form action={enterChallengeAction} className="mt-6 grid gap-4">
            <input type="hidden" name="challengeId" value={challenge.id} />
            <input type="hidden" name="path" value={`/challenges/${challenge.id}`} />
            <div>
              <label htmlFor="brewLogId" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Brew log
              </label>
              <Select id="brewLogId" name="brewLogId" required defaultValue={brewLogs[0]?.id ?? ""}>
                <option value="">No brew log yet</option>
                {brewLogs.map((brewLog) => (
                  <option key={brewLog.id} value={brewLog.id}>
                    {brewLog.title}
                  </option>
                ))}
              </Select>
              {!hasBrewLogs ? (
                <p className="mt-2 text-xs text-[var(--danger)]">Log a brew before entering this challenge.</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="notes" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Entry notes
              </label>
              <Textarea id="notes" name="notes" placeholder="What did you change for this challenge?" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!hasBrewLogs} icon={<Calendar className="h-4 w-4" aria-hidden />}>
                Enter challenge
              </Button>
              <Link href="/brews/new">
                <Button type="button" variant="secondary">
                  Log new brew
                </Button>
              </Link>
              {challenge.clubSlug ? (
                <Link href={`/clubs/${challenge.clubSlug}`}>
                  <Button type="button" variant="secondary">
                    Open club
                  </Button>
                </Link>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>Entries feed</CardTitle>
          <div className="mt-4 grid gap-3">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <article key={`${entry.challengeId}-${entry.author.id}`} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{entry.author.displayName}</p>
                      <p className="text-xs text-[var(--text-dim)]">@{entry.author.handle}</p>
                    </div>
                    {entry.brewLog ? <Badge>{entry.brewLog.rating}/5</Badge> : null}
                  </div>
                  {entry.brewLog ? (
                    <Link href={`/brews/${entry.brewLog.id}`} className="mt-3 block text-sm text-[var(--accent)]">
                      {entry.brewLog.title}
                    </Link>
                  ) : null}
                  {entry.notes ? <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{entry.notes}</p> : null}
                </article>
              ))
            ) : (
              <p className="rounded-[var(--radius-sm)] bg-white/5 p-4 text-sm text-[var(--text-muted)]">
                No entries yet. Add a brew log to start the leaderboard.
              </p>
            )}
          </div>
        </Card>
      </section>

      <aside className="grid min-w-0 content-start gap-5">
        <Card>
          <CardTitle>Rules</CardTitle>
          <ul className="mt-4 grid gap-3 text-sm text-[var(--text-muted)]">
            <li>Submit one saved brew log for the challenge.</li>
            <li>Use notes to explain the variable you changed.</li>
            <li>Leaderboard ranks average rating, then entry count.</li>
          </ul>
        </Card>

        <Card>
          <CardTitle>Leaderboard</CardTitle>
          <div className="mt-4 grid gap-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div key={entry.author.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Medal className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">
                        {index + 1}. {entry.author.displayName}
                      </strong>
                      <span className="text-xs text-[var(--text-dim)]">{entry.entryCount} entries</span>
                    </span>
                  </span>
                  <strong className="text-sm">{entry.averageRating.toFixed(1)}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No ranked entries yet.</p>
            )}
          </div>
        </Card>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
