import Image from "next/image";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { CommentThread } from "@/components/social/comment-thread";
import { ReportForm } from "@/components/social/report-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { getCommentsForTarget, getPublicGearContent } from "@/lib/data/queries";

export default async function PublicGearPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getPublicGearContent(slug);

  if (!content) {
    notFound();
  }

  const { gear, recipes, brewLogs } = content;
  const comments = await getCommentsForTarget({ targetType: "gear", targetId: gear.id });
  const path = `/gear/${slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-32 md:px-6 lg:pb-5">
      <Card className="grid gap-5 md:grid-cols-[320px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)]">
          <Image src={gear.imageUrl} alt="" fill priority sizes="320px" className="object-cover" />
        </div>
        <div>
          <Badge>{gear.type}</Badge>
          <h1 className="serif mt-3 text-5xl">{gear.name}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{gear.brand} · {gear.model}</p>
          <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[var(--text-muted)]">{gear.notes || "Shared gear profile."}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Recipes" value={recipes.length.toString()} />
            <Metric label="Public brews" value={brewLogs.length.toString()} />
            <Metric label="Default method" value={gear.defaultForMethod ?? "None"} />
          </div>
          <ReportForm targetType="gear" targetId={gear.id} path={path} />
        </div>
      </Card>
      <section className="mt-5">
        <h2 className="mb-4 text-2xl font-bold">Popular recipes using it</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.length === 0 ? (
            <Card className="sm:col-span-2 xl:col-span-3">
              <CardTitle>No public recipes yet</CardTitle>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Recipes using this gear will appear here.</p>
            </Card>
          ) : (
            recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
          )}
        </div>
      </section>
      <Card className="mt-5">
        <CommentThread comments={comments} targetType="gear" targetId={gear.id} path={path} label="Gear comment" />
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
