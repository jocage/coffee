import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StepTable } from "@/components/coffee/step-table";
import { CommentThread } from "@/components/social/comment-thread";
import { getCommentsForTarget, getOwnedRecipeById } from "@/lib/data/queries";
import { deleteRecipeAction } from "@/lib/server-actions/recipes";

export default async function OwnerRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, comments] = await Promise.all([
    getOwnedRecipeById(id),
    getCommentsForTarget({ targetType: "recipe", targetId: id })
  ]);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="serif text-4xl">{recipe.title}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Owner view · {recipe.visibility}
            {recipe.parentRecipeId ? ` · Remix of ${recipe.parentRecipeId}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Button variant="secondary" icon={<Edit className="h-4 w-4" aria-hidden />}>
              Edit
            </Button>
          </Link>
          <Link href={`/r/${recipe.author.handle}/${recipe.slug}`}>
            <Button icon={<Share2 className="h-4 w-4" aria-hidden />}>Public page</Button>
          </Link>
          <form action={deleteRecipeAction}>
            <input type="hidden" name="id" value={recipe.id} />
            <Button
              type="submit"
              variant="danger"
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              aria-label="Delete recipe"
            >
              Delete
            </Button>
          </form>
        </div>
      </div>
      <Card>
        <CardTitle>Steps</CardTitle>
        <div className="mt-4">
          <StepTable steps={recipe.steps} />
        </div>
      </Card>
      <Card className="mt-5">
        <CommentThread
          comments={comments}
          targetType="recipe"
          targetId={recipe.id}
          path={`/recipes/${recipe.id}`}
          label="Recipe comment"
        />
      </Card>
    </div>
  );
}
