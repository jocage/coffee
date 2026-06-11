import Image from "next/image";
import { Settings, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { RecipeCard } from "@/components/coffee/recipe-card";
import type { CoffeeBean, BrewLog, GearItem, Recipe, UserProfile } from "@/lib/domain";
import { followAction } from "@/lib/server-actions/social";

export function ProfileView({
  profile,
  recipes
}: {
  profile: UserProfile;
  recipes: Recipe[];
  brewLogs: BrewLog[];
  gear: GearItem[];
  coffees: CoffeeBean[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <Card className="overflow-hidden p-0">
        <div className="relative h-52">
          <Image src={profile.coverUrl} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="-mt-12 flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
          <div className="relative z-10 flex items-end gap-4">
            <Avatar src={profile.avatarUrl} alt={profile.displayName} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="serif text-4xl">{profile.displayName}</h1>
                {profile.verified ? <Badge>Verified</Badge> : null}
              </div>
              <p className="text-sm text-[var(--text-muted)]">@{profile.handle} · {profile.location}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Settings className="h-4 w-4" aria-hidden />}>Edit</Button>
            <form action={followAction}>
              <input type="hidden" name="userId" value={profile.id} />
              <input type="hidden" name="path" value={`/u/${profile.handle}`} />
              <Button icon={<UserPlus className="h-4 w-4" aria-hidden />}>Follow</Button>
            </form>
          </div>
        </div>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardTitle>Stats</CardTitle>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(profile.stats).map(([key, value]) => (
              <div key={key} className="rounded-[var(--radius-sm)] bg-white/5 p-3">
                <dt className="capitalize text-[var(--text-dim)]">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="text-xl font-bold">{Number(value).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </section>
      </div>
    </div>
  );
}
