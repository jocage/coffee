import Link from "next/link";
import Image from "next/image";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getGear } from "@/lib/data/queries";
import { deleteGearItemAction } from "@/lib/server-actions/gear";

export default async function GearPage() {
  const items = await getGear();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Gear</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Grinders, drippers, filters, scales and defaults.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/gear/grinders/new">
            <Button icon={<Plus className="h-4 w-4" aria-hidden />}>Add grinder</Button>
          </Link>
          <Link href="/gear/drippers/new">
            <Button variant="secondary">Add dripper</Button>
          </Link>
          <Link href="/gear/filters/new">
            <Button variant="secondary">Add filter</Button>
          </Link>
        </div>
      </div>
      <Tabs className="mb-5" tabs={[{ value: "all", label: "All", active: true }, { value: "grinders", label: "Grinders" }, { value: "drippers", label: "Drippers" }, { value: "filters", label: "Filters" }]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="p-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-md)]">
              <Image src={item.imageUrl} alt="" fill sizes="360px" className="object-cover" />
            </div>
            <div className="p-4">
              <Badge>{item.type}</Badge>
              <h2 className="serif mt-3 text-2xl">{item.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{item.brand} · {item.model}</p>
              <p className="mt-3 text-sm text-[var(--text-dim)]">{item.notes}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/gear/${item.id}`}>
                  <Button variant="secondary" size="sm" icon={<Eye className="h-4 w-4" aria-hidden />}>Open</Button>
                </Link>
                <Link href={`/gear/${item.id}/edit`}>
                  <Button variant="secondary" size="sm" icon={<Edit className="h-4 w-4" aria-hidden />}>Edit</Button>
                </Link>
                <form action={deleteGearItemAction}>
                  <input type="hidden" name="id" value={item.id} />
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
