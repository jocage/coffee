import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form";
import type { Collection } from "@/lib/domain";
import { addCollectionItemAction } from "@/lib/server-actions/collections";

export function AddToCollectionForm({
  collections,
  targetType,
  targetId,
  path
}: {
  collections: Collection[];
  targetType: "recipe" | "brew_log";
  targetId: string;
  path: string;
}) {
  if (collections.length === 0) {
    return (
      <div className="mt-4 grid gap-3">
        <p className="text-sm text-[var(--text-muted)]">Create a collection before saving this item into one.</p>
        <Link href="/collections">
          <Button variant="secondary" icon={<FolderPlus className="h-4 w-4" aria-hidden />}>Create collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={addCollectionItemAction} className="mt-4 grid gap-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="path" value={path} />
      <div>
        <Label htmlFor={`collection-${targetType}-${targetId}`}>Collection</Label>
        <Select id={`collection-${targetType}-${targetId}`} name="collectionId" defaultValue={collections[0]?.id}>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.title}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary" icon={<FolderPlus className="h-4 w-4" aria-hidden />}>Add to collection</Button>
    </form>
  );
}
