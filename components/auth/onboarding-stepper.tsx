"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coffee,
  Lock,
  Sparkles,
  User,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { completeOnboardingAction } from "@/lib/server-actions/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { cn } from "@/lib/format";
import type { BrewMethod, Club, UserProfile } from "@/lib/domain";

const methods: BrewMethod[] = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];

const steps = [
  { title: "Welcome", icon: Sparkles },
  { title: "Handle", icon: User },
  { title: "Methods", icon: Coffee },
  { title: "Gear", icon: Coffee },
  { title: "Coffee", icon: Coffee },
  { title: "Privacy", icon: Lock },
  { title: "Community", icon: Users }
];

export function OnboardingStepper({
  user,
  suggestedProfiles,
  suggestedClubs
}: {
  user: UserProfile;
  suggestedProfiles: UserProfile[];
  suggestedClubs: Club[];
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const currentStep = steps[stepIndex];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-6xl content-center gap-6 px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Onboarding</p>
            <h1 className="serif mt-3 text-5xl">Set up your coffee profile</h1>
          </div>

          <Card className="grid gap-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold">{currentStep.title}</span>
              <span className="text-[var(--text-muted)]">{stepIndex + 1} / {steps.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8" aria-hidden>
              <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <nav className="grid gap-1" aria-label="Onboarding steps">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.title}
                    type="button"
                    className={cn(
                      "focus-ring flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition",
                      index === stepIndex ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)] hover:bg-white/7 hover:text-[var(--text)]"
                    )}
                    aria-current={index === stepIndex ? "step" : undefined}
                    onClick={() => setStepIndex(index)}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {step.title}
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        <Card className="min-h-[660px]">
          <form action={completeOnboardingAction} noValidate className="grid h-full gap-6">
            <StepPanel active={stepIndex === 0}>
              <div className="grid h-full content-center gap-5">
                <div className="grid gap-3">
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Coffee Journey</p>
                  <h2 className="serif max-w-2xl text-5xl">Build a profile that makes every brew easier to repeat.</h2>
                  <p className="max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                    Choose your public handle, save your usual methods, add starter gear and set privacy before opening the app.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    [Coffee, "Recipes", "Your preferred methods shape recipe defaults."],
                    [Lock, "Privacy", "New content follows your selected default."],
                    [Users, "Community", "Start with suggested creators and clubs."]
                  ].map(([Icon, title, copy]) => (
                    <div key={String(title)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-4">
                      <Icon className="mb-3 h-5 w-5 text-[var(--accent)]" aria-hidden />
                      <h3 className="text-sm font-semibold">{String(title)}</h3>
                      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{String(copy)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </StepPanel>

            <StepPanel active={stepIndex === 1}>
              <CardTitle>Public identity</CardTitle>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MediaUploadField entityType="avatar" label="Add avatar" urlFieldName="avatarUrl" assetFieldName="avatarAssetId" initialUrl={user.avatarUrl} />
                <MediaUploadField entityType="cover" label="Add cover photo" urlFieldName="coverUrl" assetFieldName="coverAssetId" initialUrl={user.coverUrl} />
                <div>
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" name="displayName" defaultValue={user.displayName} autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="handle">Choose handle</Label>
                  <Input id="handle" name="handle" defaultValue={user.handle} placeholder="alexbrews" autoComplete="username" />
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
              </div>
            </StepPanel>

            <StepPanel active={stepIndex === 2}>
              <CardTitle>Favorite methods</CardTitle>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {methods.map((method) => (
                  <label key={method} className="flex min-h-20 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-4 text-sm transition hover:border-[var(--accent)]/55">
                    <input
                      type="checkbox"
                      name="favoriteMethods"
                      value={method}
                      defaultChecked={user.favoriteMethods.includes(method)}
                      className="accent-[var(--accent)]"
                    />
                    <span>
                      <strong className="block">{method}</strong>
                      <span className="text-xs text-[var(--text-muted)]">Use for recipe and brew defaults</span>
                    </span>
                  </label>
                ))}
              </div>
            </StepPanel>

            <StepPanel active={stepIndex === 3}>
              <CardTitle>First gear</CardTitle>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
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
              </div>
              <p className="mt-4 text-sm text-[var(--text-muted)]">This step is optional. Empty fields are ignored.</p>
            </StepPanel>

            <StepPanel active={stepIndex === 4}>
              <CardTitle>First coffee</CardTitle>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstCoffeeName">First coffee</Label>
                  <Input id="firstCoffeeName" name="firstCoffeeName" placeholder="Worka Chelbesa" />
                </div>
                <div>
                  <Label htmlFor="firstCoffeeRoaster">Roaster</Label>
                  <Input id="firstCoffeeRoaster" name="firstCoffeeRoaster" placeholder="Kurasa Kyoto" />
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--text-muted)]">This step is optional. Add beans now or start from the app later.</p>
            </StepPanel>

            <StepPanel active={stepIndex === 5}>
              <CardTitle>Privacy preference</CardTitle>
              <div className="mt-5 max-w-md">
                <Label htmlFor="defaultVisibility">Default content visibility</Label>
                <Select id="defaultVisibility" name="defaultVisibility" defaultValue={user.defaultVisibility}>
                  <option value="private">Private</option>
                  <option value="followers">Followers</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </Select>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  New recipes, brews, coffees and collections start with this visibility unless a form overrides it.
                </p>
              </div>
            </StepPanel>

            <StepPanel active={stepIndex === 6}>
              <CardTitle>Suggested follows and clubs</CardTitle>
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Creators</h3>
                  <div className="grid gap-3">
                    {suggestedProfiles.map((profile) => (
                      <label key={profile.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3">
                        <input type="checkbox" name="suggestedFollowIds" value={profile.id} defaultChecked className="accent-[var(--accent)]" />
                        <Avatar src={profile.avatarUrl} alt={profile.displayName} size="sm" />
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{profile.displayName}</strong>
                          <span className="block truncate text-xs text-[var(--text-muted)]">@{profile.handle}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Clubs</h3>
                  <div className="grid gap-3">
                    {suggestedClubs.map((club) => (
                      <label key={club.id} className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3">
                        <input type="checkbox" name="suggestedClubIds" value={club.id} defaultChecked className="mt-1 accent-[var(--accent)]" />
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{club.name}</strong>
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--text-muted)]">{club.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </StepPanel>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <Button type="button" variant="secondary" onClick={goBack} disabled={isFirstStep} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
                Back
              </Button>
              <div className="flex flex-wrap gap-3">
                {!isLastStep && stepIndex >= 3 ? (
                  <Button type="button" variant="ghost" onClick={goNext}>
                    Skip
                  </Button>
                ) : null}
                {isLastStep ? (
                  <Button type="submit" icon={<Check className="h-4 w-4" aria-hidden />}>
                    Finish setup
                  </Button>
                ) : (
                  <Button type="button" onClick={goNext} icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

function StepPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <section className={cn("min-h-[520px]", !active && "hidden")} aria-hidden={!active}>
      {children}
    </section>
  );
}
