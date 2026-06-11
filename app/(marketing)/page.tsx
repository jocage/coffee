import { ArrowRight, BookOpen, Coffee, Compass, Download, Timer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CoffeeLogo } from "@/components/coffee/logo";
import { RecipeCard } from "@/components/coffee/recipe-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRecipes } from "@/lib/data/queries";

export default async function LandingPage() {
  const recipes = await getRecipes();

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <CoffeeLogo />
        <nav className="hidden items-center gap-6 text-sm text-[var(--text-muted)] md:flex" aria-label="Marketing">
          <a href="#features">Features</a>
          <Link href="/explore">Explore</Link>
          <Link href="/sign-in">Log in</Link>
          <Link href="/sign-up" className="text-[var(--accent)]">
            Sign up
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-92px)] max-w-7xl items-center gap-8 px-5 pb-12 pt-4 md:grid-cols-[1fr_0.95fr]">
        <div className="relative z-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Social brewing journal</p>
          <h1 className="serif max-w-3xl text-5xl leading-[0.96] md:text-7xl">Brew better. Share more. Connect.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-muted)]">
            Track every cup, publish your best recipes, repeat brews from other coffee people, and export beautiful recipe cards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up">
              <Button size="lg" icon={<Coffee className="h-5 w-5" aria-hidden />}>
                Join Coffee Journey
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary" icon={<Compass className="h-5 w-5" aria-hidden />}>
                Explore Recipes
              </Button>
            </Link>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["52k+", "Coffee lovers"],
              ["18k+", "Recipes shared"],
              ["120k+", "Brews logged"],
              ["150+", "Countries"]
            ].map(([value, label]) => (
              <div key={label} className="border-l border-[var(--border)] pl-4">
                <dt className="text-2xl font-bold text-[var(--accent)]">{value}</dt>
                <dd className="text-xs text-[var(--text-muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
          <Image src={recipes[0].coverUrl} alt="" fill priority sizes="50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
              <RecipeCard recipe={recipes[0]} compact priority />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-3">
        {[
          [BookOpen, "Private Journal", "Keep precise brew logs, tasting notes and repeatable recipes."],
          [Timer, "Live Brew Mode", "Use guided steps, timer state and clear pour targets."],
          [Download, "Export Studio", "Create social cards for posts, stories, print and transparent overlays."]
        ].map(([Icon, title, copy]) => (
          <Card key={String(title)}>
            <Icon aria-hidden className="mb-4 h-6 w-6 text-[var(--accent)]" />
            <h2 className="serif text-2xl">{String(title)}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{String(copy)}</p>
          </Card>
        ))}
      </section>

      <div className="sticky bottom-0 z-30 border-t border-[var(--border)] bg-[var(--background)]/88 p-3 backdrop-blur md:hidden">
        <Link href="/sign-up">
          <Button className="w-full" size="lg" icon={<ArrowRight className="h-5 w-5" aria-hidden />}>
            Start brewing
          </Button>
        </Link>
      </div>
    </main>
  );
}
