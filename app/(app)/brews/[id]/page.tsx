import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Clock, Edit, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AddToCollectionForm } from "@/components/social/add-to-collection-form";
import { CommentThread } from "@/components/social/comment-thread";
import { ReportForm } from "@/components/social/report-form";
import { getBrewLogById, getCollections, getCommentsForTarget, getSocialCountsForTarget } from "@/lib/data/queries";
import { deleteBrewLogAction } from "@/lib/server-actions/brews";
import { likeAction, saveTargetAction } from "@/lib/server-actions/social";
import { formatDuration } from "@/lib/format";

export default async function BrewLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brewLog = await getBrewLogById(id);

  if (!brewLog) {
    notFound();
  }

  const [comments, socialCounts, collections] = await Promise.all([
    getCommentsForTarget({ targetType: "brew_log", targetId: brewLog.id }),
    getSocialCountsForTarget({ targetType: "brew_log", targetId: brewLog.id }),
    getCollections()
  ]);
  const path = `/brews/${brewLog.id}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 pb-32 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-5">
      <main className="grid gap-5">
        <Card className="p-0">
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-[var(--radius-md)]">
            <Image src={brewLog.photos[0]} alt="" fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{brewLog.visibility}</Badge>
                  <Badge>{brewLog.method}</Badge>
                </div>
                <h1 className="serif mt-3 text-4xl md:text-5xl">{brewLog.title}</h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {brewLog.recipe ? (
                    <>
                      Brewed from <Link href={`/recipes/${brewLog.recipe.id}`} className="text-[var(--accent)]">{brewLog.recipe.title}</Link> with {brewLog.coffee.name}.
                    </>
                  ) : (
                    <>Free brew with {brewLog.coffee.name}.</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-white/8 px-3 py-2 text-[var(--accent)]">
                <Star className="h-4 w-4 fill-current" aria-hidden />
                <span className="font-bold">{brewLog.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Dose" value={`${brewLog.doseGrams} g`} />
              <Metric label={brewLog.method === "Espresso" ? "Water in" : "Water"} value={`${brewLog.waterGrams} g`} />
              {brewLog.outputGrams ? <Metric label={brewLog.method === "Espresso" ? "Yield" : "Output"} value={`${brewLog.outputGrams} g`} /> : null}
              <Metric label="Temp" value={`${brewLog.temperatureCelsius} C`} />
              <Metric label="Time" value={formatDuration(brewLog.brewTimeSeconds)} />
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle>Tasting notes</CardTitle>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{brewLog.tastingNotes}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {brewLog.flavorTags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </Card>
        <Card>
          <CommentThread comments={comments} targetType="brew_log" targetId={brewLog.id} path={path} label="Brew log comment" />
        </Card>
      </main>
      <aside className="grid content-start gap-4">
        <Card>
          <CardTitle>Actions</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <form action={saveTargetAction}>
              <input type="hidden" name="targetType" value="brew_log" />
              <input type="hidden" name="targetId" value={brewLog.id} />
              <input type="hidden" name="path" value={path} />
              <Button className="w-full" variant="secondary" icon={<Bookmark className="h-4 w-4" aria-hidden />}>Save</Button>
            </form>
            <form action={likeAction}>
              <input type="hidden" name="targetType" value="brew_log" />
              <input type="hidden" name="targetId" value={brewLog.id} />
              <input type="hidden" name="path" value={path} />
              <Button className="w-full" variant="secondary" icon={<Star className="h-4 w-4" aria-hidden />}>Like</Button>
            </form>
            <Link href={`/brews/${brewLog.id}/edit`}>
              <Button className="w-full" variant="secondary" icon={<Edit className="h-4 w-4" aria-hidden />}>Edit</Button>
            </Link>
            <form action={deleteBrewLogAction}>
              <input type="hidden" name="id" value={brewLog.id} />
              <Button className="w-full" type="submit" variant="danger" icon={<Trash2 className="h-4 w-4" aria-hidden />}>Delete</Button>
            </form>
          </div>
        </Card>
        <Card>
          <CardTitle>Report</CardTitle>
          <ReportForm targetType="brew_log" targetId={brewLog.id} path={path} />
        </Card>
        <Card>
          <CardTitle>Add to collection</CardTitle>
          <AddToCollectionForm collections={collections} targetType="brew_log" targetId={brewLog.id} path={path} />
        </Card>
        <Card>
          <CardTitle>Actual settings</CardTitle>
          <div className="mt-4 grid gap-3 text-sm">
            <p className="flex items-center justify-between gap-3"><span className="text-[var(--text-muted)]">Grind</span><span>{brewLog.grindSetting}</span></p>
            <p className="flex items-center justify-between gap-3"><span className="text-[var(--text-muted)]">Method</span><span>{brewLog.method}</span></p>
            {brewLog.pressureBars ? <p className="flex items-center justify-between gap-3"><span className="text-[var(--text-muted)]">Pressure</span><span>{brewLog.pressureBars} bar</span></p> : null}
            <p className="flex items-center justify-between gap-3"><span className="text-[var(--text-muted)]">Brewed</span><span>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(brewLog.brewedAt))}</span></p>
            <p className="flex items-center justify-between gap-3"><span className="text-[var(--text-muted)]">Comments</span><span>{socialCounts.comments}</span></p>
            <p className="flex items-center justify-between gap-3"><span className="text-[var(--text-muted)]">Saves</span><span>{socialCounts.saves}</span></p>
          </div>
        </Card>
        {brewLog.recipe ? (
          <Card>
            <CardTitle>Recipe timing</CardTitle>
            <div className="mt-4 grid gap-3">
              {brewLog.recipe.steps.slice(0, 4).map((step) => (
                <div key={step.id} className="rounded-[var(--radius-sm)] bg-white/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-[var(--accent)]" aria-hidden />{step.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDuration(step.startsAtSeconds)} · {step.instruction}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
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
