import Link from "next/link";
import { Download, Plus, Search, Upload } from "lucide-react";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { getMyGear, getMyRecipes, getSavedRecipes } from "@/lib/data/queries";
import type { BrewMethod, Visibility } from "@/lib/domain";

type RecipeView = "mine" | "saved";
type SetupFilter = "all" | "compatible";

const visibilityTabs: Array<{ value: Visibility | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "followers", label: "Followers" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" }
];

const viewTabs: Array<{ value: RecipeView; label: string }> = [
  { value: "mine", label: "My recipes" },
  { value: "saved", label: "Saved" }
];

const methodFilters: Array<{ value: BrewMethod | "all"; label: string }> = [
  { value: "all", label: "All methods" },
  { value: "V60", label: "V60" },
  { value: "Origami", label: "Origami" },
  { value: "Kalita", label: "Kalita" },
  { value: "AeroPress", label: "AeroPress" },
  { value: "Espresso", label: "Espresso" },
  { value: "French Press", label: "French Press" },
  { value: "Switch", label: "Switch" }
];

export default async function RecipesPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    visibility?: string;
    view?: string;
    method?: string;
    gearId?: string;
    setup?: string;
    imported?: string;
  }>;
}) {
  const params = await searchParams;
  const visibility = visibilityTabs.some((tab) => tab.value === params.visibility)
    ? (params.visibility as Visibility | "all")
    : "all";
  const method = methodFilters.some((option) => option.value === params.method)
    ? (params.method as BrewMethod | "all")
    : "all";
  const view = params.view === "saved" ? "saved" : "mine";
  const setup: SetupFilter = params.setup === "compatible" ? "compatible" : "all";
  const gear = await getMyGear();
  const gearId = gear.some((item) => item.id === params.gearId) ? params.gearId : "";
  const recipes =
    view === "saved"
      ? await getSavedRecipes({
          query: params.q,
          method,
          visibility,
          gearId,
          compatible: setup === "compatible"
        })
      : await getMyRecipes({
          query: params.q,
          method,
          visibility,
          gearId,
          compatible: setup === "compatible"
        });
  const baseQuery = new URLSearchParams();
  if (params.q) baseQuery.set("q", params.q);
  if (view === "saved") baseQuery.set("view", "saved");
  if (method !== "all") baseQuery.set("method", method);
  if (gearId) baseQuery.set("gearId", gearId);
  if (setup !== "all") baseQuery.set("setup", setup);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recipes</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Draft, publish and repeat your brew recipes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/recipes/import">
            <Button variant="secondary" icon={<Upload className="h-4 w-4" aria-hidden />}>
              Import
            </Button>
          </Link>
          <Link href="/recipes/export" prefetch={false}>
            <Button variant="secondary" icon={<Download className="h-4 w-4" aria-hidden />}>
              Export JSON
            </Button>
          </Link>
          <Link href="/recipes/new">
            <Button icon={<Plus className="h-4 w-4" aria-hidden />}>New recipe</Button>
          </Link>
        </div>
      </div>
      {params.imported ? (
        <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-sm">
          Imported {params.imported} recipes.
        </div>
      ) : null}
      <form
        action="/recipes"
        className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_170px_190px_170px_auto]"
      >
        {view === "saved" ? <input type="hidden" name="view" value="saved" /> : null}
        <Input
          name="q"
          defaultValue={params.q}
          placeholder="Search my recipes..."
          aria-label="Search recipes"
        />
        <Select
          name="visibility"
          defaultValue={visibility}
          aria-label="Filter recipes by visibility"
          className="md:w-40"
        >
          {visibilityTabs.map((tab) => (
            <option key={tab.value} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </Select>
        <Select name="method" defaultValue={method} aria-label="Filter recipes by method">
          {methodFilters.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="gearId" defaultValue={gearId} aria-label="Filter recipes by gear">
          <option value="">Any gear</option>
          {gear.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select name="setup" defaultValue={setup} aria-label="Filter recipes by setup">
          <option value="all">Any setup</option>
          <option value="compatible">My setup</option>
        </Select>
        <Button type="submit" variant="secondary" icon={<Search className="h-4 w-4" aria-hidden />}>
          Search
        </Button>
      </form>
      <div className="mb-3">
        <Tabs
          tabs={viewTabs.map((tab) => {
            const query = new URLSearchParams();
            if (params.q) query.set("q", params.q);
            if (visibility !== "all") query.set("visibility", visibility);
            if (method !== "all") query.set("method", method);
            if (gearId) query.set("gearId", gearId);
            if (setup !== "all") query.set("setup", setup);
            if (tab.value !== "mine") query.set("view", tab.value);
            return {
              value: tab.value,
              label: tab.label,
              active: view === tab.value,
              href: query.size > 0 ? `/recipes?${query.toString()}` : "/recipes"
            };
          })}
        />
      </div>
      <div className="mb-5">
        <Tabs
          tabs={visibilityTabs.map((tab) => {
            const query = new URLSearchParams(baseQuery);
            if (tab.value !== "all") query.set("visibility", tab.value);
            return {
              value: tab.value,
              label: tab.label,
              active: visibility === tab.value,
              href: query.size > 0 ? `/recipes?${query.toString()}` : "/recipes"
            };
          })}
        />
      </div>
      {recipes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white/5 p-8 text-center">
          <h2 className="text-lg font-semibold">
            {view === "saved"
              ? "No saved recipes match this filter"
              : "No recipes match this filter"}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {view === "saved"
              ? "Save recipes from public pages to build this list."
              : "Clear the search or create a new recipe with this visibility."}
          </p>
        </div>
      )}
    </div>
  );
}
