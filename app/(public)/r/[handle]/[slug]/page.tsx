import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, MessageCircle, Repeat2, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StepTable } from "@/components/coffee/step-table";
import { TasteRadar } from "@/components/coffee/taste-radar";
import { AddToCollectionForm } from "@/components/social/add-to-collection-form";
import { CommentThread } from "@/components/social/comment-thread";
import { ReportForm } from "@/components/social/report-form";
import { getCollections, getCommentsForTarget, getPublicRecipe, getSocialCountsForTarget } from "@/lib/data/queries";
import { formatDuration, formatRatio } from "@/lib/format";
import { remixRecipeAction } from "@/lib/server-actions/recipes";
import { likeAction, saveTargetAction } from "@/lib/server-actions/social";

type Params = { handle: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle, slug } = await params;
  const recipe = await getPublicRecipe(handle, slug);

  if (!recipe) {
    return { title: "Recipe not found" };
  }

  return {
    title: recipe.title,
    description: recipe.description,
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      images: [recipe.coverUrl]
    }
  };
}

export default async function PublicRecipePage({ params }: { params: Promise<Params> }) {
  const { handle, slug } = await params;
  const recipe = await getPublicRecipe(handle, slug);

  if (!recipe) {
    notFound();
  }

  const path = `/r/${recipe.author.handle}/${recipe.slug}`;
  const [comments, socialCounts, collections] = await Promise.all([
    getCommentsForTarget({ targetType: "recipe", targetId: recipe.id }),
    getSocialCountsForTarget({ targetType: "recipe", targetId: recipe.id }),
    getCollections()
  ]);

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[1fr_380px]">
      <section className="grid gap-5">
        <Card className="overflow-hidden p-0">
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge>{recipe.method}</Badge>
                {recipe.parentRecipeId ? <Badge>Remix</Badge> : null}
              </div>
              <h1 className="serif mt-5 text-5xl leading-none">{recipe.title}</h1>
              <p className="mt-4 text-[var(--text-muted)]">{recipe.description}</p>
              <Link href={`/u/${recipe.author.handle}`} className="mt-6 flex items-center gap-3">
                <Avatar src={recipe.author.avatarUrl} alt={recipe.author.displayName} size="sm" />
                <span>
                  <span className="block text-sm font-semibold">{recipe.author.displayName}</span>
                  <span className="block text-xs text-[var(--text-dim)]">@{recipe.author.handle}</span>
                </span>
              </Link>
              <div className="mt-6 flex flex-wrap gap-2">
                {recipe.flavorNotes.map((note) => (
                  <Badge key={note}>{note}</Badge>
                ))}
              </div>
            </div>
            <div className="relative min-h-[360px]">
              <Image src={recipe.coverUrl} alt="" fill priority sizes="60vw" className="object-cover" />
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardTitle>Cup profile</CardTitle>
            <div className="mt-5">
              <TasteRadar profile={recipe.tasteProfile} />
            </div>
          </Card>
          <Card>
            <CardTitle>Flavor notes</CardTitle>
            <h2 className="serif mt-4 text-3xl">{recipe.flavorNotes.join(", ")}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{recipe.subtitle}</p>
          </Card>
        </div>

        <Card>
          <CardTitle>Pouring steps</CardTitle>
          <div className="mt-4">
            <StepTable steps={recipe.steps} />
          </div>
        </Card>
      </section>

      <aside className="grid content-start gap-5">
        <Card>
          <CardTitle>Brew plan</CardTitle>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            {[
              ["Coffee", `${recipe.doseGrams}g`],
              ["Water", `${recipe.waterGrams}g`],
              ["Ratio", formatRatio(recipe.doseGrams, recipe.waterGrams)],
              ["Temp", `${recipe.temperatureCelsius}C`],
              ["Grind", recipe.grindLabel],
              ["Time", formatDuration(recipe.totalTimeSeconds)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[var(--radius-sm)] bg-white/5 p-3">
                <dt className="text-xs text-[var(--text-dim)]">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-3">
            <Link href={`/brew/${recipe.id}`}>
              <Button className="w-full">Brew this recipe</Button>
            </Link>
            <div className="grid grid-cols-4 gap-2">
              <form action={saveTargetAction}>
                <input type="hidden" name="targetType" value="recipe" />
                <input type="hidden" name="targetId" value={recipe.id} />
                <input type="hidden" name="path" value={path} />
                <Button variant="secondary" size="icon" aria-label="Save" icon={<Bookmark className="h-4 w-4" aria-hidden />} />
              </form>
              <form action={likeAction}>
                <input type="hidden" name="targetType" value="recipe" />
                <input type="hidden" name="targetId" value={recipe.id} />
                <input type="hidden" name="path" value={path} />
                <Button variant="secondary" size="icon" aria-label="Like" icon={<Star className="h-4 w-4" aria-hidden />} />
              </form>
              <form action={remixRecipeAction}>
                <input type="hidden" name="recipeId" value={recipe.id} />
                <input type="hidden" name="path" value={path} />
                <Button variant="secondary" size="icon" aria-label="Remix" icon={<Repeat2 className="h-4 w-4" aria-hidden />} />
              </form>
              <Button variant="secondary" size="icon" aria-label="Open comments" icon={<MessageCircle className="h-4 w-4" aria-hidden />} />
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle>Social proof</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric icon={<Star className="h-4 w-4 fill-current" />} value={recipe.stats.averageRating.toFixed(1)} label="Rating" />
            <Metric value={recipe.stats.brews.toLocaleString()} label="Brews" />
            <Metric value={(recipe.stats.saves + socialCounts.saves).toLocaleString()} label="Saves" />
            <Metric value={(recipe.stats.comments + socialCounts.comments).toLocaleString()} label="Comments" />
          </div>
        </Card>
        <Card>
          <CardTitle>Add to collection</CardTitle>
          <AddToCollectionForm collections={collections} targetType="recipe" targetId={recipe.id} path={path} />
        </Card>
        <Card>
          <CardTitle>Report</CardTitle>
          <ReportForm targetType="recipe" targetId={recipe.id} path={path} />
        </Card>
        <Card>
          <CommentThread comments={comments} targetType="recipe" targetId={recipe.id} path={path} label="Recipe comment" />
        </Card>
      </aside>
    </main>
  );
}

function Metric({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-white/5 p-3">
      <p className="flex items-center gap-1 text-xl font-bold text-[var(--accent)]">
        {icon}
        {value}
      </p>
      <p className="text-xs text-[var(--text-dim)]">{label}</p>
    </div>
  );
}
