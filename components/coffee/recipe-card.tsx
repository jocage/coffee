import { Clock, Droplets, Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

export function RecipeCard({ recipe, compact = false, priority = false }: { recipe: Recipe; compact?: boolean; priority?: boolean }) {
  return (
    <Card className="overflow-hidden p-0">
      <Link href={`/r/${recipe.author.handle}/${recipe.slug}`} className="block">
        <div className={compact ? "grid grid-cols-[96px_1fr]" : ""}>
          <div className={compact ? "relative h-full min-h-28" : "relative aspect-[4/3]"}>
            <Image src={recipe.coverUrl} alt="" fill priority={priority} sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          </div>
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <Badge>{recipe.method}</Badge>
              <span className="flex items-center gap-1 text-xs text-[var(--accent)]">
                <Star aria-hidden className="h-3.5 w-3.5 fill-current" />
                {recipe.stats.averageRating.toFixed(1)}
              </span>
            </div>
            <h3 className="serif text-xl leading-tight">{recipe.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{recipe.subtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-dim)]">
              <span className="inline-flex items-center gap-1">
                <Droplets aria-hidden className="h-3.5 w-3.5" />
                {formatRatio(recipe.doseGrams, recipe.waterGrams)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden className="h-3.5 w-3.5" />
                {formatDuration(recipe.totalTimeSeconds)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart aria-hidden className="h-3.5 w-3.5" />
                {recipe.stats.likes}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
