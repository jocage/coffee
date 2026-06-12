import Link from "next/link";
import { Database, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/form";
import { GearForm } from "@/components/forms/grinder-form";
import { getCurrentUser, getDripperCatalog, getDripperCatalogItemById } from "@/lib/data/queries";
import { addDripperFromCatalogAction, addDripperToCatalogAction } from "@/lib/server-actions/gear";
import type { DripperCatalogItem, Visibility } from "@/lib/domain";

type SearchParams = {
  catalog?: string;
  q?: string;
};

export default async function NewDripperPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { catalog: selectedCatalogId, q } = await searchParams;
  const user = await getCurrentUser();
  const [catalogItems, selectedCatalogItem] = await Promise.all([
    getDripperCatalog({ query: q, status: "approved" }),
    selectedCatalogId ? getDripperCatalogItemById(selectedCatalogId) : Promise.resolve(null)
  ]);
  const dripperDefaults =
    selectedCatalogItem?.status === "approved" ? selectedCatalogItem : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">New Dripper</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Pick a known dripper or add a custom brewer to the shared catalog.
          </p>
        </div>
        {dripperDefaults ? (
          <Link
            href="/gear/drippers/new"
            className="focus-ring inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-white/12"
          >
            Clear template
          </Link>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardTitle>
            {dripperDefaults ? `Dripper details from ${dripperDefaults.name}` : "Dripper details"}
          </CardTitle>
          <GearForm
            gearType="dripper"
            defaultVisibility={user.defaultVisibility}
            dripperDefaults={dripperDefaults}
            submitLabel="Save dripper"
          />
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              <CardTitle className="mb-0">Dripper catalog</CardTitle>
            </div>
            <form action="/gear/drippers/new" className="mb-4 flex gap-2">
              <Input
                name="q"
                placeholder="Search brand, model or filter"
                defaultValue={q}
                aria-label="Search dripper catalog"
              />
              <Button
                type="submit"
                size="icon"
                variant="secondary"
                aria-label="Search"
                icon={<Search className="h-4 w-4" aria-hidden />}
              />
            </form>
            <div className="grid max-h-[32rem] gap-3 overflow-y-auto pr-1">
              {catalogItems.map((item) => (
                <CatalogItem key={item.id} item={item} defaultVisibility={user.defaultVisibility} />
              ))}
              {catalogItems.length === 0 ? (
                <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">
                  No approved drippers found.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              <CardTitle className="mb-0">Add to catalog</CardTitle>
            </div>
            <form action={addDripperToCatalogAction} className="grid gap-3">
              <Field id="catalog-name" name="name" label="Name" placeholder="Orea V4 Wide" />
              <Field id="catalog-brand" name="brand" label="Brand" placeholder="Orea" />
              <Field id="catalog-model" name="model" label="Model" placeholder="V4 Wide" />
              <Field
                id="catalog-material"
                name="material"
                label="Material"
                placeholder="Plastic, ceramic, glass"
              />
              <Field id="catalog-size" name="size" label="Size" placeholder="02, M, 185, Wide" />
              <Field
                id="catalog-brew-speed"
                name="brewSpeed"
                label="Brew speed"
                placeholder="Fast, balanced, immersion"
              />
              <Field
                id="catalog-compatible-filters"
                name="compatibleFilters"
                label="Compatible filters"
                placeholder="V60 02, Kalita 185"
              />
              <div>
                <Label htmlFor="catalog-notes">Notes</Label>
                <Textarea
                  id="catalog-notes"
                  name="notes"
                  placeholder="Flow behavior, quirks, filter fit."
                />
              </div>
              <Button type="submit">Submit dripper</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CatalogItem({
  item,
  defaultVisibility
}: {
  item: DripperCatalogItem;
  defaultVisibility: Visibility;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{item.name}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {item.brand} · {item.model}
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-[var(--text-dim)]">
          {item.brewSpeed || "dripper"}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-dim)]">
        {item.compatibleFilters || item.notes}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/gear/drippers/new?catalog=${item.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-white/12"
        >
          Use template
        </Link>
        <form action={addDripperFromCatalogAction}>
          <input type="hidden" name="catalogItemId" value={item.id} />
          <input type="hidden" name="visibility" value={defaultVisibility} />
          <Button type="submit" size="sm">
            Add to my gear
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  placeholder
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} placeholder={placeholder} />
    </div>
  );
}
