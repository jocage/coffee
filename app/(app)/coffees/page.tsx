import Link from "next/link";
import Image from "next/image";
import { Edit, Eye, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getCoffees } from "@/lib/data/queries";
import { deleteCoffeeAction } from "@/lib/server-actions/coffee";

export default async function CoffeesPage() {
  const coffees = await getCoffees();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Coffees</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Your beans, roast dates and tasting memory.</p>
        </div>
        <Link href="/coffees/new">
          <Button icon={<Plus className="h-4 w-4" aria-hidden />}>Add coffee</Button>
        </Link>
      </div>
      <Tabs className="mb-5" tabs={[{ value: "active", label: "Active", active: true }, { value: "finished", label: "Finished" }, { value: "wishlist", label: "Wishlist" }]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coffees.map((coffee, index) => (
          <Card key={coffee.id} className="p-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-md)]">
              <Image src={coffee.imageUrl} alt="" fill priority={index === 0} sizes="360px" className="object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Badge>{coffee.roastLevel}</Badge>
                <span className="flex items-center gap-1 text-sm text-[var(--accent)]"><Star className="h-4 w-4 fill-current" />{coffee.rating}</span>
              </div>
              <h2 className="serif mt-3 text-2xl">{coffee.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{coffee.roaster} · {coffee.origin}</p>
              <p className="mt-3 text-sm text-[var(--text-dim)]">{coffee.flavorNotes.join(", ")}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/coffee/${coffee.slug}`}>
                  <Button variant="secondary" size="sm" icon={<Eye className="h-4 w-4" aria-hidden />}>Open</Button>
                </Link>
                <Link href={`/coffees/${coffee.id}/edit`}>
                  <Button variant="secondary" size="sm" icon={<Edit className="h-4 w-4" aria-hidden />}>Edit</Button>
                </Link>
                <form action={deleteCoffeeAction}>
                  <input type="hidden" name="id" value={coffee.id} />
                  <Button type="submit" variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />}>Delete</Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
