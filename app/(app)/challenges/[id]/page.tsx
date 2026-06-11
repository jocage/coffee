import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/form";
import { getBrewLogs, getChallengeById } from "@/lib/data/queries";
import { enterChallengeAction } from "@/lib/server-actions/community";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [challenge, brewLogs] = await Promise.all([getChallengeById(id), getBrewLogs()]);

  if (!challenge) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 pb-32 md:px-6 lg:pb-5">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Challenge</CardTitle>
            <h1 className="serif mt-3 text-5xl">{challenge.title}</h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">{challenge.description}</p>
          </div>
          <Trophy className="h-10 w-10 text-[var(--accent)]" aria-hidden />
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
            <label htmlFor="brewLogId" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Brew log</label>
            <Select id="brewLogId" name="brewLogId" defaultValue={brewLogs[0]?.id ?? ""}>
              <option value="">No brew log yet</option>
              {brewLogs.map((brewLog) => (
                <option key={brewLog.id} value={brewLog.id}>
                  {brewLog.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="notes" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Entry notes</label>
            <Textarea id="notes" name="notes" placeholder="What did you change for this challenge?" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" icon={<Calendar className="h-4 w-4" aria-hidden />}>Enter challenge</Button>
            <Link href="/brews/new">
              <Button type="button" variant="secondary">Log new brew</Button>
            </Link>
            {challenge.clubSlug ? (
              <Link href={`/clubs/${challenge.clubSlug}`}>
                <Button type="button" variant="secondary">Open club</Button>
              </Link>
            ) : null}
          </div>
        </form>
      </Card>
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
