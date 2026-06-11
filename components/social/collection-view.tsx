import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { Collection } from "@/lib/domain";
import { removeCollectionItemAction } from "@/lib/server-actions/collections";

export function CollectionView({ collection, ownerView = false }: { collection: Collection; ownerView?: boolean }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-32 md:px-6 lg:pb-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{collection.visibility}</Badge>
              <Badge>{collection.itemCount} items</Badge>
            </div>
            <h1 className="serif mt-3 text-5xl">{collection.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{collection.description || "A curated set of recipes and brew logs."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Avatar src={collection.owner.avatarUrl} alt={collection.owner.displayName} size="sm" />
            <div>
              <p className="text-sm font-semibold">{collection.owner.displayName}</p>
              <p className="text-xs text-[var(--text-dim)]">@{collection.owner.handle}</p>
            </div>
          </div>
        </div>
        {ownerView && collection.visibility === "public" ? (
          <Link href={`/u/${collection.owner.handle}/collections/${collection.slug}`} className="mt-5 inline-flex">
            <Button variant="secondary" icon={<ExternalLink className="h-4 w-4" aria-hidden />}>Open public page</Button>
          </Link>
        ) : null}
      </Card>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.items.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardTitle>No items yet</CardTitle>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Saved recipes and brew logs can be organized here as the collection grows.</p>
          </Card>
        ) : (
          collection.items.map((item) => (
            <Card key={item.id} className="p-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-md)]">
                <Image src={item.imageUrl} alt="" fill sizes="360px" className="object-cover" />
              </div>
              <div className="p-4">
                <Badge>{item.targetType}</Badge>
                <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{item.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={itemHref(item.targetType, item.targetId)}>
                    <Button variant="secondary" size="sm">Open</Button>
                  </Link>
                  {ownerView ? (
                    <form action={removeCollectionItemAction}>
                      <input type="hidden" name="collectionId" value={collection.id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="path" value={`/collections/${collection.id}`} />
                      <Button type="submit" variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />}>Remove</Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function itemHref(targetType: string, targetId: string) {
  if (targetType === "brew_log") {
    return `/brews/${targetId}`;
  }

  if (targetType === "recipe") {
    return `/recipes/${targetId}`;
  }

  return "#";
}
