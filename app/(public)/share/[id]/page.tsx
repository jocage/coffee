import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Coffee, Download, Timer } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ExportPreview } from "@/components/export/export-preview";
import { getRecipeById } from "@/lib/data/queries";
import { formatDuration, formatRatio } from "@/lib/format";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getShareableRecipe(id);

  if (!recipe) {
    return { title: "Shared recipe not found" };
  }

  return {
    title: `${recipe.title} export`,
    description: recipe.description,
    openGraph: {
      title: `${recipe.title} export`,
      description: recipe.description,
      images: [recipe.coverUrl]
    }
  };
}

export default async function SharePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const recipe = await getShareableRecipe(id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid gap-5">
        <Card className="overflow-hidden p-0">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge>{recipe.method}</Badge>
                <Badge>{recipe.visibility}</Badge>
              </div>
              <h1 className="serif mt-5 text-5xl leading-none">{recipe.title}</h1>
              <p className="mt-4 leading-7 text-[var(--text-muted)]">{recipe.description}</p>
              <Link href={`/u/${recipe.author.handle}`} className="mt-6 flex items-center gap-3">
                <Avatar src={recipe.author.avatarUrl} alt={recipe.author.displayName} size="sm" />
                <span>
                  <span className="block text-sm font-semibold">{recipe.author.displayName}</span>
                  <span className="block text-xs text-[var(--text-dim)]">@{recipe.author.handle}</span>
                </span>
              </Link>
              <div className="mt-6 flex flex-wrap gap-2">
                {recipe.flavorNotes.slice(0, 5).map((note) => (
                  <Badge key={note}>{note}</Badge>
                ))}
              </div>
            </div>
            <div className="relative min-h-[340px]">
              <Image src={recipe.coverUrl} alt="" fill priority sizes="50vw" className="object-cover" />
            </div>
          </div>
        </Card>

        <ExportPreview recipe={recipe} />
      </section>

      <aside className="grid content-start gap-5">
        <Card>
          <CardTitle>Shared card</CardTitle>
          <dl className="mt-5 grid gap-3 text-sm">
            {[
              ["Coffee", `${recipe.doseGrams}g`],
              ["Water", `${recipe.waterGrams}g`],
              ["Ratio", formatRatio(recipe.doseGrams, recipe.waterGrams)],
              ["Time", formatDuration(recipe.totalTimeSeconds)]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3">
                <dt className="text-[var(--text-muted)]">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-3">
            <Link href={`/brew/${recipe.id}`}>
              <Button className="w-full" icon={<Timer className="h-4 w-4" aria-hidden />}>
                Brew recipe
              </Button>
            </Link>
            <Link href={`/r/${recipe.author.handle}/${recipe.slug}`}>
              <Button variant="secondary" className="w-full" icon={<Coffee className="h-4 w-4" aria-hidden />}>
                Open recipe
              </Button>
            </Link>
            <Link href="/export-studio">
              <Button variant="secondary" className="w-full" icon={<Download className="h-4 w-4" aria-hidden />}>
                Create export
              </Button>
            </Link>
          </div>
        </Card>
      </aside>
    </main>
  );
}

async function getShareableRecipe(id: string) {
  const recipe = await getRecipeById(id);

  if (!recipe || (recipe.visibility !== "public" && recipe.visibility !== "unlisted")) {
    return null;
  }

  return recipe;
}
