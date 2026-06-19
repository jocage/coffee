import Image from "next/image";
import Link from "next/link";
import { ExploreFilterDrawer } from "@/components/explore/explore-filter-drawer";
import {
  CompactExploreSearch,
  ExploreFilterFields,
  exploreDifficulties,
  exploreMethods,
  exploreRoastLevels,
  exploreVisibilities,
  type ExploreFilterValues,
  type ExploreGearOption
} from "@/components/explore/explore-filter-fields";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getClubs, getCoffees, getGear, getProfiles, searchRecipes } from "@/lib/data/queries";
import type { BrewMethod, GearItem, Recipe, Visibility } from "@/lib/domain";

type ExploreSearchParams = {
  q?: string;
  method?: string;
  visibility?: string;
  tab?: string;
  doseMin?: string;
  doseMax?: string;
  waterMin?: string;
  waterMax?: string;
  ratioMin?: string;
  ratioMax?: string;
  temperatureMin?: string;
  temperatureMax?: string;
  timeMax?: string;
  grinder?: string;
  dripper?: string;
  roastLevel?: string;
  process?: string;
  flavor?: string;
  difficulty?: string;
  worksWithSetup?: string;
};

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const params = await searchParams;
  const method =
    exploreMethods.includes(params.method as BrewMethod) && params.method !== "all"
      ? (params.method as BrewMethod)
      : undefined;
  const visibility = exploreVisibilities.includes(params.visibility as Visibility)
    ? (params.visibility as Visibility | "all")
    : "all";
  const difficulty = exploreDifficulties.includes(params.difficulty as Recipe["difficulty"])
    ? (params.difficulty as Recipe["difficulty"])
    : "all";
  const roastLevel = exploreRoastLevels.includes(
    params.roastLevel as (typeof exploreRoastLevels)[number]
  )
    ? params.roastLevel
    : "all";
  const tab = params.tab ?? "recipes";
  const [recipes, profiles, coffees, gear, clubs] = await Promise.all([
    searchRecipes({
      query: params.q,
      method,
      visibility,
      doseMin: toNumber(params.doseMin),
      doseMax: toNumber(params.doseMax),
      waterMin: toNumber(params.waterMin),
      waterMax: toNumber(params.waterMax),
      ratioMin: toNumber(params.ratioMin),
      ratioMax: toNumber(params.ratioMax),
      temperatureMin: toNumber(params.temperatureMin),
      temperatureMax: toNumber(params.temperatureMax),
      timeMax: toNumber(params.timeMax),
      grinder: params.grinder,
      dripper: params.dripper,
      roastLevel,
      process: params.process,
      flavor: params.flavor,
      difficulty,
      worksWithSetup: params.worksWithSetup === "1"
    }),
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
  const filterValues: ExploreFilterValues = {
    q: params.q,
    tab,
    method: method ?? "all",
    visibility,
    doseMin: params.doseMin,
    doseMax: params.doseMax,
    waterMin: params.waterMin,
    waterMax: params.waterMax,
    ratioMin: params.ratioMin,
    ratioMax: params.ratioMax,
    temperatureMin: params.temperatureMin,
    temperatureMax: params.temperatureMax,
    timeMax: params.timeMax,
    grinder: params.grinder,
    dripper: params.dripper,
    roastLevel,
    process: params.process,
    flavor: params.flavor,
    difficulty,
    worksWithSetup: params.worksWithSetup === "1"
  };
  const grinderOptions = toGearOptions(gear.filter((item) => item.type === "grinder"));
  const dripperOptions = toGearOptions(gear.filter((item) => item.type === "dripper"));
  const processOptions = Array.from(
    new Set(coffees.map((coffee) => coffee.process).filter(Boolean))
  ).sort();
  const baseQuery = buildFilterQuery(filterValues);

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <Card className="sticky top-24">
          <CardTitle>Filters</CardTitle>
          <form action="/explore" className="mt-5">
            <ExploreFilterFields
              values={filterValues}
              grinders={grinderOptions}
              drippers={dripperOptions}
              processes={processOptions}
              idPrefix="desktop-filter"
            />
          </form>
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
          <ExploreFilterDrawer
            values={filterValues}
            grinders={grinderOptions}
            drippers={dripperOptions}
            processes={processOptions}
          />
        </div>
        <CompactExploreSearch values={filterValues} />
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
                <div key={recipe.id} className="grid gap-2">
                  {filterValues.worksWithSetup ? <Badge>Setup match</Badge> : null}
                  <RecipeCard recipe={recipe} />
                </div>
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

function toNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toGearOptions(items: GearItem[]): ExploreGearOption[] {
  return items.map((item) => ({
    id: item.id,
    label: `${item.brand} ${item.model}`
  }));
}

function buildFilterQuery(values: ExploreFilterValues): URLSearchParams {
  const query = new URLSearchParams();
  appendParam(query, "q", values.q);
  appendParam(query, "method", values.method === "all" ? undefined : values.method);
  appendParam(query, "visibility", values.visibility === "all" ? undefined : values.visibility);
  appendParam(query, "doseMin", values.doseMin);
  appendParam(query, "doseMax", values.doseMax);
  appendParam(query, "waterMin", values.waterMin);
  appendParam(query, "waterMax", values.waterMax);
  appendParam(query, "ratioMin", values.ratioMin);
  appendParam(query, "ratioMax", values.ratioMax);
  appendParam(query, "temperatureMin", values.temperatureMin);
  appendParam(query, "temperatureMax", values.temperatureMax);
  appendParam(query, "timeMax", values.timeMax);
  appendParam(query, "grinder", values.grinder === "all" ? undefined : values.grinder);
  appendParam(query, "dripper", values.dripper === "all" ? undefined : values.dripper);
  appendParam(query, "roastLevel", values.roastLevel === "all" ? undefined : values.roastLevel);
  appendParam(query, "process", values.process === "all" ? undefined : values.process);
  appendParam(query, "flavor", values.flavor);
  appendParam(query, "difficulty", values.difficulty === "all" ? undefined : values.difficulty);
  if (values.worksWithSetup) query.set("worksWithSetup", "1");
  return query;
}

function appendParam(query: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) query.set(key, value);
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
