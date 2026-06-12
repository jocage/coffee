import { BookOpen, ChevronRight, Coffee, Plus, Settings } from "lucide-react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrewLogCard } from "@/components/coffee/brew-log-card";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { TasteRadar } from "@/components/coffee/taste-radar";
import { FeedCard } from "@/components/social/feed-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getDashboardData, getHomeFeed } from "@/lib/data/queries";

export default async function HomePage() {
  const dashboard = await getDashboardData();
  const feed = await getHomeFeed("for-you");
  const firstName = dashboard.user.displayName.split(" ")[0] || "there";
  const heroImage = dashboard.focusRecipe?.coverUrl || dashboard.user.coverUrl;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 overflow-x-hidden px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="grid min-w-0 gap-5">
        <Card className="relative min-w-0 overflow-hidden p-0">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="900px"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/62 to-black/20" />
          <div className="relative z-10 w-full max-w-xl p-6 md:p-10">
            <p className="text-sm font-semibold text-[var(--accent)]">Good morning, {firstName}.</p>
            <h1 className="serif mt-4 text-4xl leading-none sm:text-5xl md:text-6xl">
              Every drop tells your story.
            </h1>
            <p className="mt-4 text-[var(--text-muted)]">
              Track brews. Refine recipes. Share your craft.
            </p>
            <div className="mt-8 flex gap-6">
              <div>
                <p className="text-2xl font-bold">{dashboard.recentBrews.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Brews logged</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.recipes.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Recipes</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="min-w-0">
            <CardTitle>Today&apos;s brew focus</CardTitle>
            {dashboard.focusRecipe ? (
              <>
                <h2 className="serif mt-4 text-3xl">{dashboard.focusRecipe.title}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {dashboard.focusRecipe.subtitle}
                </p>
                <dl className="mt-6 grid gap-3 text-sm">
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--text-muted)]">Method</dt>
                    <dd>{dashboard.focusRecipe.method}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--text-muted)]">Grind</dt>
                    <dd>{dashboard.focusRecipe.grindLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-muted)]">Water</dt>
                    <dd>
                      {dashboard.focusRecipe.temperatureCelsius}C /{" "}
                      {dashboard.focusRecipe.waterGrams}g
                    </dd>
                  </div>
                </dl>
                <Link href={`/brew/${dashboard.focusRecipe.id}`} className="mt-6 inline-block">
                  <Button>Start brewing</Button>
                </Link>
              </>
            ) : (
              <EmptyPanel
                title="No brew focus yet"
                body="Create your first recipe or save a public recipe to make this panel useful."
                actionHref="/recipes/new"
                actionLabel="Create recipe"
              />
            )}
          </Card>

          <div className="grid min-w-0 gap-5">
            <Card className="min-w-0">
              <CardTitle>Quick actions</CardTitle>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <QuickActionLink key={action.href} {...action} />
                ))}
              </div>
            </Card>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Recent brews</CardTitle>
                <Link href="/brews" className="text-sm text-[var(--accent)]">
                  View all
                </Link>
              </CardHeader>
              {dashboard.recentBrews.length > 0 ? (
                <div className="grid gap-3">
                  {dashboard.recentBrews.map((brew) => (
                    <BrewLogCard key={brew.id} brewLog={brew} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  title="No brews logged"
                  body="Log a brew to track ratings, grind changes and tasting notes."
                  actionHref="/brews/new"
                  actionLabel="Log brew"
                  compact
                />
              )}
            </Card>
          </div>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Social feed</CardTitle>
            <Tabs
              tabs={[
                { value: "for-you", label: "For You", active: true },
                { value: "following", label: "Following" },
                { value: "popular", label: "Popular" },
                { value: "latest", label: "Latest" }
              ]}
            />
          </CardHeader>
          <div className="grid gap-4">
            {feed.length > 0 ? (
              feed.map((item) => <FeedCard key={item.id} item={item} />)
            ) : (
              <EmptyPanel
                title="No public activity yet"
                body="Follow brewers or publish a recipe to build your feed."
                actionHref="/explore"
                actionLabel="Explore"
                compact
              />
            )}
          </div>
        </Card>
      </section>

      <aside className="grid min-w-0 content-start gap-5">
        <Card>
          <CardTitle>Saved recipes</CardTitle>
          {dashboard.favoriteRecipes.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {dashboard.favoriteRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} compact />
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Nothing saved"
              body="Save recipes from Explore to collect references for later brews."
              actionHref="/explore"
              actionLabel="Find recipes"
              compact
            />
          )}
        </Card>
        {dashboard.focusRecipe ? (
          <Card>
            <CardTitle>Taste profile</CardTitle>
            <div className="mt-5">
              <TasteRadar profile={dashboard.focusRecipe.tasteProfile} />
            </div>
          </Card>
        ) : null}
        <Card>
          <CardTitle>Trending now</CardTitle>
          <ol className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
            {[
              "Ethiopia natural clarity",
              "Blooming tips",
              "Low agitation pours",
              "High extraction Kalita"
            ].map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/8 text-xs text-[var(--accent)]">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}

const quickActions: Array<{
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  detail: string;
}> = [
  { href: "/brews/new", icon: Plus, label: "New brew", detail: "Log a cup" },
  { href: "/recipes/new", icon: BookOpen, label: "Recipe", detail: "Build a brew" },
  { href: "/gear", icon: Settings, label: "Gear", detail: "Catalog and setup" },
  { href: "/coffees/new", icon: Coffee, label: "Coffee", detail: "Add beans" }
];

function QuickActionLink({
  href,
  icon: Icon,
  label,
  detail
}: {
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="focus-ring group flex min-h-16 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/[0.04] px-3 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-white/[0.07]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--accent)]/12 text-[var(--accent)] transition group-hover:bg-[var(--accent)] group-hover:text-black">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-5 text-[var(--text)]">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--text-dim)]">{detail}</span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[var(--text-dim)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
        aria-hidden
      />
    </Link>
  );
}

function EmptyPanel({
  title,
  body,
  actionHref,
  actionLabel,
  compact = false
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-4"
          : "mt-6 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-5"
      }
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
      <Link href={actionHref} className="mt-4 inline-block">
        <Button size="sm">{actionLabel}</Button>
      </Link>
    </div>
  );
}
