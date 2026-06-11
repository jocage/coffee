import { Check, Coffee, Lock, Users } from "lucide-react";
import { completeOnboardingAction } from "@/lib/server-actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { getCurrentUser } from "@/lib/data/queries";

const methods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl content-center gap-6 px-5 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Onboarding</p>
        <h1 className="serif mt-3 text-5xl">Set up your coffee profile</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [Coffee, "Methods", "V60, Origami, Kalita"],
          [Lock, "Privacy", "Private-first by default"],
          [Users, "Community", "Suggested follows and clubs"]
        ].map(([Icon, title, copy]) => (
          <Card key={String(title)}>
            <Icon aria-hidden className="mb-4 h-6 w-6 text-[var(--accent)]" />
            <h2 className="font-semibold">{String(title)}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{String(copy)}</p>
          </Card>
        ))}
      </div>
      <Card>
        <form action={completeOnboardingAction} className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <CardTitle>Public identity</CardTitle>
            </div>
            <MediaUploadField entityType="avatar" label="Add avatar" urlFieldName="avatarUrl" assetFieldName="avatarAssetId" initialUrl={user.avatarUrl} />
            <MediaUploadField entityType="cover" label="Add cover photo" urlFieldName="coverUrl" assetFieldName="coverAssetId" initialUrl={user.coverUrl} />
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={user.displayName} required />
            </div>
            <div>
              <Label htmlFor="handle">Choose handle</Label>
              <Input id="handle" name="handle" defaultValue={user.handle} placeholder="alexbrews" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" defaultValue={user.bio} placeholder="What do you brew and share?" />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={user.location} placeholder="Warsaw, Poland" />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" defaultValue={user.website} placeholder="https://example.com" />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <CardTitle>Brew preferences</CardTitle>
            </div>
            <fieldset>
              <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Favorite methods</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {methods.map((method) => (
                  <label key={method} className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-white/5 p-3 text-sm">
                    <input
                      type="checkbox"
                      name="favoriteMethods"
                      value={method}
                      defaultChecked={user.favoriteMethods.includes(method as never)}
                      className="accent-[var(--accent)]"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <Label htmlFor="defaultVisibility">Default privacy</Label>
              <Select id="defaultVisibility" name="defaultVisibility" defaultValue={user.defaultVisibility}>
                <option value="private">Private</option>
                <option value="followers">Followers</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </Select>
              <p className="mt-2 text-xs text-[var(--text-dim)]">New brews and recipes start private unless you publish them.</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <CardTitle>Optional starter kit</CardTitle>
            </div>
            <div>
              <Label htmlFor="firstCoffeeName">First coffee</Label>
              <Input id="firstCoffeeName" name="firstCoffeeName" placeholder="Worka Chelbesa" />
            </div>
            <div>
              <Label htmlFor="firstCoffeeRoaster">Roaster</Label>
              <Input id="firstCoffeeRoaster" name="firstCoffeeRoaster" placeholder="Kurasa Kyoto" />
            </div>
            <div>
              <Label htmlFor="firstGearName">First grinder</Label>
              <Input id="firstGearName" name="firstGearName" placeholder="Comandante C40" />
            </div>
            <div>
              <Label htmlFor="firstGearBrand">Brand</Label>
              <Input id="firstGearBrand" name="firstGearBrand" placeholder="Comandante" />
            </div>
            <div>
              <Label htmlFor="firstGearModel">Model</Label>
              <Input id="firstGearModel" name="firstGearModel" placeholder="C40 MK4" />
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" icon={<Check className="h-4 w-4" aria-hidden />}>
              Finish setup
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
