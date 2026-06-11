import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { getCollections, getCurrentUser } from "@/lib/data/queries";
import { createCollectionAction } from "@/lib/server-actions/collections";

export default async function CollectionsPage() {
  const [collections, user] = await Promise.all([getCollections(), getCurrentUser()]);

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 pb-32 md:px-6 lg:grid-cols-[360px_1fr] lg:pb-5">
      <Card>
        <CardTitle>Create collection</CardTitle>
        <form action={createCollectionAction} className="mt-5 grid gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Summer filter recipes" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What belongs in this collection?" />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select id="visibility" name="visibility" defaultValue={user.defaultVisibility}>
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </div>
          <Button type="submit" icon={<FolderPlus className="h-4 w-4" aria-hidden />}>Create collection</Button>
        </form>
      </Card>
      <section>
        <div className="mb-5">
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Organize saved recipes, brew logs and shareable coffee sets.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {collections.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardTitle>No collections yet</CardTitle>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Create your first collection to start grouping recipes and brew logs.</p>
            </Card>
          ) : (
            collections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Card className="h-full transition hover:border-[var(--accent)]">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{collection.visibility}</Badge>
                    <Badge>{collection.itemCount} items</Badge>
                  </div>
                  <h2 className="serif mt-3 text-3xl">{collection.title}</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{collection.description || "Curated coffee content."}</p>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
