import { Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { getClubs, getCoffees, getGear, getProfiles, searchRecipes } from "@/lib/data/queries";
import type { BrewMethod, Visibility } from "@/lib/domain";

const methods: Array<BrewMethod | "all"> = [
  "all",
  "V60",
  "Origami",
  "Kalita",
  "AeroPress",
  "Espresso",
  "French Press",
  "Switch"
];
const visibilities: Array<Visibility | "all"> = [
  "all",
  "public",
  "followers",
  "unlisted",
  "private"
];

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    method?: string;
    visibility?: string;
    tab?: string;
    compatible?: string;
  }>;
}) {
  const params = await searchParams;
  const method =
    methods.includes(params.method as BrewMethod) && params.method !== "all"
      ? (params.method as BrewMethod)
      : undefined;
  const visibility = visibilities.includes(params.visibility as Visibility)
    ? (params.visibility as Visibility | "all")
    : "all";
  const tab = params.tab ?? "recipes";
  const compatible = params.compatible === "1";
  const [recipes, profiles, coffees, gear, clubs] = await Promise.all([
    searchRecipes({ query: params.q, method, visibility, compatible, prioritizeCompatible: true }),
    getProfiles(),
    getCoffees(),
    getGear(),
    getClubs()
  ]);
  const query = params.q?.trim().toLowerCase();
  const filteredProfiles = query
    ? profiles.filter((profile) =>
        [profile.displayName, profile.handle, profile.bio, profile.location].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
    : profiles;
  const filteredCoffees = query
    ? coffees.filter((coffee) =>
        [
          coffee.name,
          coffee.roaster,
          coffee.origin,
          coffee.process,
          coffee.flavorNotes.join(" ")
        ].some((value) => value.toLowerCase().includes(query))
      )
    : coffees;
  const filteredGear = query
    ? gear.filter((item) =>
        [item.name, item.brand, item.model, item.notes, item.type].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
    : gear;
  const filteredClubs = query
    ? clubs.filter((club) =>
        [club.name, club.description, club.slug].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
    : clubs;
  const baseQuery = new URLSearchParams();
  if (params.q) baseQuery.set("q", params.q);
  if (method) baseQuery.set("method", method);
  if (visibility !== "all") baseQuery.set("visibility", visibility);
  if (compatible) baseQuery.set("compatible", "1");

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <Card className="sticky top-24">
          <CardTitle>Filters</CardTitle>
          <FilterForm
            q={params.q}
            method={method ?? "all"}
            visibility={visibility}
            compatible={compatible}
          />
        </Card>
      </aside>
      <section>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Explore</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Find recipes, people, beans, gear and clubs.
            </p>
          </div>
          <Button variant="secondary" icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}>
            Filters
          </Button>
        </div>
        <form className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]" action="/explore">
          <input type="hidden" name="tab" value={tab} />
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="Search recipes, people, flavor notes..."
            aria-label="Search explore"
          />
          <Select
            name="method"
            defaultValue={method ?? "all"}
            aria-label="Filter by brew method"
            className="md:w-44"
          >
            {methods.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All methods" : item}
              </option>
            ))}
          </Select>
          <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm">
            <input
              type="checkbox"
              name="compatible"
              value="1"
              defaultChecked={compatible}
              className="accent-[var(--accent)]"
            />
            Setup match
          </label>
          <Button
            type="submit"
            variant="secondary"
            icon={<Search className="h-4 w-4" aria-hidden />}
          >
            Search
          </Button>
        </form>
        <Tabs
          className="mb-5"
          tabs={["recipes", "people", "beans", "gear", "clubs"].map((item) => {
            const query = new URLSearchParams(baseQuery);
            query.set("tab", item);
            return {
              value: item,
              label: item[0].toUpperCase() + item.slice(1),
              active: tab === item,
              href: `/explore?${query.toString()}`
            };
          })}
        />
        {tab === "recipes" ? (
          recipes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <EmptySearchState />
          )
        ) : tab === "people" ? (
          filteredProfiles.length > 0 ? (
            <PeopleGrid profiles={filteredProfiles} />
          ) : (
            <EmptySearchState />
          )
        ) : tab === "beans" ? (
          filteredCoffees.length > 0 ? (
            <CoffeeGrid coffees={filteredCoffees} />
          ) : (
            <EmptySearchState />
          )
        ) : tab === "gear" ? (
          filteredGear.length > 0 ? (
            <GearGrid gear={filteredGear} />
          ) : (
            <EmptySearchState />
          )
        ) : tab === "clubs" ? (
          filteredClubs.length > 0 ? (
            <ClubGrid clubs={filteredClubs} />
          ) : (
            <EmptySearchState />
          )
        ) : (
          <EmptySearchState />
        )}
      </section>
    </div>
  );
}

function FilterForm({
  q,
  method,
  visibility,
  compatible
}: {
  q?: string;
  method: BrewMethod | "all";
  visibility: Visibility | "all";
  compatible: boolean;
}) {
  return (
    <form action="/explore" className="mt-5 grid gap-4 text-sm">
      <div>
        <Label htmlFor="desktop-q">Search</Label>
        <Input id="desktop-q" name="q" defaultValue={q} placeholder="Recipe or note" />
      </div>
      <div>
        <Label htmlFor="desktop-method">Brew method</Label>
        <Select id="desktop-method" name="method" defaultValue={method}>
          {methods.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All methods" : item}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="desktop-visibility">Visibility</Label>
        <Select id="desktop-visibility" name="visibility" defaultValue={visibility}>
          {visibilities.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All visibility" : item}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-white/5 p-3">
        <input
          type="checkbox"
          name="compatible"
          value="1"
          defaultChecked={compatible}
          className="accent-[var(--accent)]"
        />
        Works with my setup
      </label>
      <Button
        type="submit"
        variant="secondary"
        icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
      >
        Apply filters
      </Button>
    </form>
  );
}

function EmptySearchState() {
  return (
    <Card className="grid min-h-56 place-items-center text-center">
      <div>
        <CardTitle>No recipes found</CardTitle>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Try a broader search, a different method, or reset visibility.
        </p>
      </div>
    </Card>
  );
}

function PeopleGrid({ profiles }: { profiles: Awaited<ReturnType<typeof getProfiles>> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {profiles.map((profile) => (
        <Link
          key={profile.id}
          href={`/u/${profile.handle}`}
          className="focus-ring rounded-[var(--radius-md)]"
        >
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <Avatar src={profile.avatarUrl} alt={profile.displayName} size="md" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{profile.displayName}</h2>
                <p className="truncate text-sm text-[var(--text-muted)]">@{profile.handle}</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm text-[var(--text-muted)]">{profile.bio}</p>
            <div className="mt-4 flex gap-2 text-xs text-[var(--text-dim)]">
              <span>{profile.stats.recipes} recipes</span>
              <span>{profile.stats.followers.toLocaleString()} followers</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function CoffeeGrid({ coffees }: { coffees: Awaited<ReturnType<typeof getCoffees>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {coffees.map((coffee) => (
        <Card key={coffee.id} className="overflow-hidden p-0">
          <div className="relative aspect-[4/3]">
            <Image src={coffee.imageUrl} alt="" fill sizes="360px" className="object-cover" />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge>{coffee.roastLevel}</Badge>
              <span className="text-sm text-[var(--accent)]">{coffee.rating.toFixed(1)}</span>
            </div>
            <h2 className="serif mt-3 text-2xl">{coffee.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {coffee.roaster} · {coffee.origin}
            </p>
            <p className="mt-3 line-clamp-2 text-sm text-[var(--text-dim)]">
              {coffee.flavorNotes.join(", ")}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GearGrid({ gear }: { gear: Awaited<ReturnType<typeof getGear>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {gear.map((item) => (
        <Card key={item.id} className="overflow-hidden p-0">
          <div className="relative aspect-[4/3]">
            <Image src={item.imageUrl} alt="" fill sizes="360px" className="object-cover" />
          </div>
          <div className="p-4">
            <Badge>{item.type}</Badge>
            <h2 className="serif mt-3 text-2xl">{item.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {item.brand} · {item.model}
            </p>
            <p className="mt-3 line-clamp-2 text-sm text-[var(--text-dim)]">{item.notes}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ClubGrid({ clubs }: { clubs: Awaited<ReturnType<typeof getClubs>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {clubs.map((club) => (
        <Link
          key={club.id}
          href={`/clubs/${club.slug}`}
          className="focus-ring rounded-[var(--radius-md)]"
        >
          <Card className="h-full overflow-hidden p-0">
            <div className="relative aspect-[4/3]">
              <Image src={club.coverUrl} alt="" fill sizes="360px" className="object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge>{club.visibility}</Badge>
                <span className="text-xs text-[var(--text-dim)]">
                  {club.memberCount.toLocaleString()} members
                </span>
              </div>
              <h2 className="serif mt-3 text-2xl">{club.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-[var(--text-muted)]">
                {club.description}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
