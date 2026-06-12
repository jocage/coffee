import Link from "next/link";
import { Database, Plus, Search } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { GrinderForm } from "@/components/forms/grinder-form";
import { getCurrentUser, getGrinderCatalog, getGrinderCatalogItemById } from "@/lib/data/queries";
import { addGrinderFromCatalogAction, addGrinderToCatalogAction } from "@/lib/server-actions/gear";
import type { GrinderCatalogItem, Visibility } from "@/lib/domain";

type SearchParams = {
  catalog?: string;
  q?: string;
};

export default async function NewGrinderPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { catalog: selectedCatalogId, q } = await searchParams;
  const user = await getCurrentUser();
  const [catalogItems, selectedCatalogItem] = await Promise.all([
    getGrinderCatalog({ query: q, status: "approved" }),
    selectedCatalogId ? getGrinderCatalogItemById(selectedCatalogId) : Promise.resolve(null)
  ]);
  const grinderDefaults =
    selectedCatalogItem?.status === "approved" ? selectedCatalogItem : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">New Grinder</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Pick a known model or save a new one for everyone.
          </p>
        </div>
        {grinderDefaults ? (
          <Link
            href="/gear/grinders/new"
            className="focus-ring inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-white/12"
          >
            Clear template
          </Link>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardTitle>
            {grinderDefaults ? `Grinder details from ${grinderDefaults.name}` : "Grinder details"}
          </CardTitle>
          <GrinderForm
            defaultVisibility={user.defaultVisibility}
            grinderDefaults={grinderDefaults}
          />
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              <CardTitle className="mb-0">Grinder catalog</CardTitle>
            </div>
            <form action="/gear/grinders/new" className="mb-4 flex gap-2">
              <Input
                name="q"
                placeholder="Search brand or model"
                defaultValue={q}
                aria-label="Search grinder catalog"
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
                  No approved grinders found.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              <CardTitle className="mb-0">Add to catalog</CardTitle>
            </div>
            <form action={addGrinderToCatalogAction} className="grid gap-3">
              <Field id="catalog-name" name="name" label="Catalog title" placeholder="Comandante C40" />
              <Field id="catalog-brand" name="brand" label="Maker" placeholder="Comandante" />
              <Field id="catalog-model" name="model" label="Catalog version" placeholder="C40 MK4" />
              <div>
                <Label htmlFor="catalog-drive">Drive</Label>
                <Select id="catalog-drive" name="grinderDrive" defaultValue="manual">
                  <option value="manual">Manual</option>
                  <option value="electric">Electric</option>
                </Select>
              </div>
              <Field
                id="catalog-burr-type"
                name="burrType"
                label="Burr type"
                placeholder="Stainless steel conical burrs"
              />
              <Field
                id="catalog-filter-range"
                name="filterRange"
                label="Filter range"
                placeholder="40-45 clicks"
              />
              <div>
                <Label htmlFor="catalog-notes">Notes</Label>
                <Textarea
                  id="catalog-notes"
                  name="notes"
                  placeholder="Useful details for other brewers."
                />
              </div>
              <Button type="submit">Submit grinder</Button>
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
  item: GrinderCatalogItem;
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
          {item.grinderDrive}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-dim)]">
        {item.burrType || item.notes}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/gear/grinders/new?catalog=${item.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-white/12"
        >
          Use template
        </Link>
        <form action={addGrinderFromCatalogAction}>
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
