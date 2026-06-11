import { Calendar, Edit, Eye, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BrewLog } from "@/lib/domain";
import { formatDuration } from "@/lib/format";
import { deleteBrewLogAction } from "@/lib/server-actions/brews";

export function BrewLogCard({ brewLog }: { brewLog: BrewLog }) {
  const heading = brewLog.recipe?.title ?? brewLog.coffee.name;

  return (
    <Card className="grid grid-cols-[88px_1fr] gap-4 p-3">
      <div className="relative min-h-24 overflow-hidden rounded-[var(--radius-sm)]">
        <Image src={brewLog.photos[0]} alt="" fill sizes="120px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-semibold">{heading}</h3>
            <Badge>{brewLog.method}</Badge>
          </div>
          <span className="flex items-center gap-1 text-sm text-[var(--accent)]">
            {brewLog.rating}
            <Star aria-hidden className="h-3.5 w-3.5 fill-current" />
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{brewLog.title}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-dim)]">
          <span className="inline-flex items-center gap-1">
            <Calendar aria-hidden className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(brewLog.brewedAt))}
          </span>
          <span>{formatDuration(brewLog.brewTimeSeconds)}</span>
          {brewLog.outputGrams ? <span>{brewLog.outputGrams}g out</span> : null}
          <span>{brewLog.grindSetting}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/brews/${brewLog.id}`}>
            <Button variant="secondary" size="sm" icon={<Eye className="h-4 w-4" aria-hidden />}>Open</Button>
          </Link>
          <Link href={`/brews/${brewLog.id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit className="h-4 w-4" aria-hidden />}>Edit</Button>
          </Link>
          <form action={deleteBrewLogAction}>
            <input type="hidden" name="id" value={brewLog.id} />
            <Button type="submit" variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />}>Delete</Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
