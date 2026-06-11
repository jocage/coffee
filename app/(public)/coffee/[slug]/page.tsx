import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { CommentThread } from "@/components/social/comment-thread";
import { ReportForm } from "@/components/social/report-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { getCommentsForTarget, getPublicCoffeeContent } from "@/lib/data/queries";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getPublicCoffeeContent(slug);

  if (!content) {
    return { title: "Coffee not found" };
  }

  return {
    title: `${content.coffee.roaster} ${content.coffee.name}`,
    description: `${content.coffee.origin} ${content.coffee.process} coffee recipes and brew logs.`
  };
}

export default async function PublicCoffeePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const content = await getPublicCoffeeContent(slug);

  if (!content) {
    notFound();
  }

  const { coffee, recipes, brewLogs } = content;
  const comments = await getCommentsForTarget({ targetType: "coffee", targetId: coffee.id });
  const path = `/coffee/${coffee.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/7] min-h-72">
          <Image src={coffee.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <Badge>{coffee.roastLevel}</Badge>
            <h1 className="serif mt-3 text-5xl">{coffee.name}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{coffee.roaster} · {coffee.origin} · {coffee.process}</p>
          </div>
        </div>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardTitle>Lot profile</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {coffee.flavorNotes.map((note) => (
              <Badge key={note}>{note}</Badge>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <Metric label="Rating" value={coffee.rating.toFixed(1)} />
            <Metric label="Recipes" value={recipes.length.toString()} />
            <Metric label="Public brews" value={brewLogs.length.toString()} />
          </dl>
          <ReportForm targetType="coffee" targetId={coffee.id} path={path} />
        </Card>
        <section>
          <h2 className="mb-4 text-2xl font-bold">Best recipes with this coffee</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.length === 0 ? (
              <Card className="sm:col-span-2 xl:col-span-3">
                <CardTitle>No public recipes yet</CardTitle>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Public recipes using this coffee will appear here.</p>
              </Card>
            ) : (
              recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
            )}
          </div>
        </section>
      </div>
      <Card className="mt-5">
        <CommentThread comments={comments} targetType="coffee" targetId={coffee.id} path={path} label="Coffee comment" />
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-white/5 p-3">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
