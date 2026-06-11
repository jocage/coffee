import { Bookmark, Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeedItem } from "@/lib/domain";
import { formatDuration } from "@/lib/format";
import { likeAction, saveTargetAction } from "@/lib/server-actions/social";

export function FeedCard({ item }: { item: FeedItem }) {
  const recipe = item.type === "recipe" ? item.recipe : item.brewLog.recipe;
  const image = item.type === "recipe" ? item.recipe.coverUrl : item.brewLog.photos[0];
  const body = item.type === "recipe" ? item.recipe.description : `${item.brewLog.title}. ${item.brewLog.tastingNotes}`;
  const targetType = item.type === "recipe" ? "recipe" : "brew_log";
  const targetId = item.type === "recipe" ? item.recipe.id : item.brewLog.id;
  const title = item.type === "recipe" ? item.recipe.title : recipe?.title ?? item.brewLog.title;
  const detailHref = item.type === "recipe" ? `/r/${item.recipe.author.handle}/${item.recipe.slug}` : `/brews/${item.brewLog.id}`;
  const method = item.type === "recipe" ? item.recipe.method : item.brewLog.method;
  const doseGrams = item.type === "recipe" ? item.recipe.doseGrams : item.brewLog.doseGrams;
  const totalTime = item.type === "recipe" ? item.recipe.totalTimeSeconds : item.brewLog.brewTimeSeconds;
  const temperature = item.type === "recipe" ? item.recipe.temperatureCelsius : item.brewLog.temperatureCelsius;
  const stats = item.type === "recipe" ? item.recipe.stats : { likes: 0, comments: item.brewLog.flavorTags.length };

  return (
    <Card className="p-0">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/u/${item.author.handle}`} className="flex items-center gap-3">
            <Avatar src={item.author.avatarUrl} alt={item.author.displayName} size="sm" />
            <span>
              <span className="block text-sm font-semibold">{item.author.displayName}</span>
              <span className="block text-xs text-[var(--text-dim)]">@{item.author.handle}</span>
            </span>
          </Link>
          <Badge>{item.type === "recipe" ? "Recipe" : "Brew log"}</Badge>
        </div>
        <h2 className="serif mt-4 text-2xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
      </div>
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden">
        <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <Badge className="bg-black/55">{method}</Badge>
          <Badge className="bg-black/55">{doseGrams}g</Badge>
          <Badge className="bg-black/55">{formatDuration(totalTime)}</Badge>
          <Badge className="bg-black/55">{temperature}C</Badge>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-1">
          <form action={likeAction}>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="path" value="/home" />
            <Button variant="ghost" size="sm" icon={<Heart className="h-4 w-4" aria-hidden />}>
              {stats.likes}
            </Button>
          </form>
          <Button variant="ghost" size="sm" icon={<MessageCircle className="h-4 w-4" aria-hidden />}>
            {stats.comments}
          </Button>
          <Button variant="ghost" size="sm" icon={<Share2 className="h-4 w-4" aria-hidden />}>
            Share
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <form action={saveTargetAction}>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="path" value="/home" />
            <Button variant="ghost" size="icon" aria-label={item.type === "recipe" ? "Save recipe" : "Save brew log"} icon={<Bookmark className="h-4 w-4" aria-hidden />} />
          </form>
          <Button variant="secondary" size="sm" icon={<Repeat2 className="h-4 w-4" aria-hidden />}>
            {item.type === "recipe" ? "Brew this" : "Open brew"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
