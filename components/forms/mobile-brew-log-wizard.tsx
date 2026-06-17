"use client";

import { ArrowLeft, ArrowRight, Check, Coffee, Eye, ImagePlus, Scale, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import type { BrewLog, CoffeeBean, Recipe, Visibility } from "@/lib/domain";
import { cn, formatDuration } from "@/lib/format";

const brewMethods = [
  "V60",
  "Origami",
  "Kalita",
  "AeroPress",
  "Espresso",
  "French Press",
  "Switch"
] as const;

const wizardSteps = [
  { title: "Source", icon: Coffee },
  { title: "Brew data", icon: Scale },
  { title: "Tasting", icon: Star },
  { title: "Photos", icon: ImagePlus },
  { title: "Visibility", icon: Eye },
  { title: "Save", icon: Check }
];

export function MobileBrewLogWizard({
  recipes,
  coffees,
  defaultRecipeId,
  defaultVisibility = "private",
  brewLog,
  action,
  submitLabel = "Save Brew Log"
}: {
  recipes: Recipe[];
  coffees: CoffeeBean[];
  defaultRecipeId?: string;
  defaultVisibility?: Visibility;
  brewLog?: BrewLog;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}) {
  const initialRecipe =
    brewLog?.recipe ?? recipes.find((recipe) => recipe.id === defaultRecipeId) ?? recipes[0];
  const initialCoffee = brewLog?.coffee ?? initialRecipe?.coffee ?? coffees[0];
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRecipeId, setSelectedRecipeId] = useState(initialRecipe?.id ?? "");
  const [selectedCoffeeId, setSelectedCoffeeId] = useState(initialCoffee?.id ?? "");
  const activeStep = wizardSteps[stepIndex];
  const selectedRecipe = selectedRecipeId
    ? (recipes.find((recipe) => recipe.id === selectedRecipeId) ?? initialRecipe)
    : undefined;
  const selectedCoffee =
    coffees.find((coffee) => coffee.id === selectedCoffeeId) ??
    selectedRecipe?.coffee ??
    initialCoffee;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === wizardSteps.length - 1;
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / wizardSteps.length) * 100),
    [stepIndex]
  );

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, wizardSteps.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <form action={action} noValidate className="grid gap-4 lg:hidden">
      {brewLog ? <input type="hidden" name="id" value={brewLog.id} /> : null}

      <Card className="sticky top-3 z-10 grid gap-4 bg-[#10100f]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Brew Log</p>
            <h2 className="text-lg font-bold">{activeStep.title}</h2>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {stepIndex + 1} / {wizardSteps.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8" aria-hidden>
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="flex gap-2 overflow-x-auto scrollbar-none"
          aria-label="Brew log wizard steps"
        >
          {wizardSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.title}
                type="button"
                className={cn(
                  "focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border transition",
                  index === stepIndex
                    ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                    : "border-[var(--border)] bg-white/5 text-[var(--text-muted)]"
                )}
                aria-label={step.title}
                aria-current={index === stepIndex ? "step" : undefined}
                onClick={() => setStepIndex(index)}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            );
          })}
        </div>
      </Card>

      <WizardPanel active={stepIndex === 0}>
        <Card>
          <CardTitle>Recipe / coffee</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-brew-recipeId">Recipe source</Label>
              <Select
                id="mobile-brew-recipeId"
                name="recipeId"
                value={selectedRecipeId}
                onChange={(event) => setSelectedRecipeId(event.currentTarget.value)}
              >
                <option value="">Free brew / no recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="mobile-brew-coffeeId">Coffee bean</Label>
              <Select
                id="mobile-brew-coffeeId"
                name="coffeeId"
                value={selectedCoffeeId}
                onChange={(event) => setSelectedCoffeeId(event.currentTarget.value)}
              >
                {coffees.length === 0 ? <option value="">Add coffee first</option> : null}
                {coffees.map((coffee) => (
                  <option key={coffee.id} value={coffee.id}>
                    {coffee.name} · {coffee.roaster}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="mobile-brew-method">Method</Label>
              <Select
                id="mobile-brew-method"
                name="method"
                defaultValue={brewLog?.method ?? selectedRecipe?.method ?? "V60"}
              >
                {brewMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 1}>
        <Card key={selectedRecipe?.id ?? "free-brew"}>
          <CardTitle>Actual brew data</CardTitle>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field
              id="mobile-brew-doseGrams"
              name="doseGrams"
              label="Dose grams"
              value={String(brewLog?.doseGrams ?? selectedRecipe?.doseGrams ?? 18)}
            />
            <Field
              id="mobile-brew-waterGrams"
              name="waterGrams"
              label="Water grams"
              value={String(brewLog?.waterGrams ?? selectedRecipe?.waterGrams ?? 36)}
            />
            <Field
              id="mobile-brew-outputGrams"
              name="outputGrams"
              label="Yield grams"
              value={
                brewLog?.outputGrams
                  ? String(brewLog.outputGrams)
                  : selectedRecipe?.method === "Espresso"
                    ? String(selectedRecipe.waterGrams)
                    : ""
              }
              optional
            />
            <Field
              id="mobile-brew-temperatureCelsius"
              name="temperatureCelsius"
              label="Temperature C"
              value={String(
                brewLog?.temperatureCelsius ?? selectedRecipe?.temperatureCelsius ?? 93
              )}
            />
            <Field
              id="mobile-brew-brewTimeSeconds"
              name="brewTimeSeconds"
              label="Time seconds"
              value={String(brewLog?.brewTimeSeconds ?? selectedRecipe?.totalTimeSeconds ?? 30)}
            />
            <Field
              id="mobile-brew-pressureBars"
              name="pressureBars"
              label="Pressure bars"
              value={brewLog?.pressureBars ? String(brewLog.pressureBars) : ""}
              optional
            />
            <div className="col-span-2">
              <Label htmlFor="mobile-brew-grindSetting">Grind notes</Label>
              <Input
                id="mobile-brew-grindSetting"
                name="grindSetting"
                defaultValue={brewLog?.grindSetting ?? selectedRecipe?.grindSetting ?? ""}
                placeholder="C40 42 clicks, Niche 18"
              />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 2}>
        <Card>
          <CardTitle>Rating / tasting</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-brew-rating">Brew rating</Label>
              <Input
                id="mobile-brew-rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                defaultValue={brewLog?.rating ?? 5}
              />
            </div>
            <div>
              <Label htmlFor="mobile-brew-tastingNotes">Tasting notes</Label>
              <Textarea
                id="mobile-brew-tastingNotes"
                name="tastingNotes"
                defaultValue={brewLog?.tastingNotes ?? "Tasted very clean with floral notes."}
              />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 3}>
        <Card>
          <CardTitle>Photos</CardTitle>
          <div className="mt-5">
            <MediaUploadField
              entityType="brew_log"
              label="Add brew photo"
              urlFieldName="photoUrl"
              initialUrl={brewLog?.photos[0]}
            />
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 4}>
        <Card>
          <CardTitle>Visibility</CardTitle>
          <div className="mt-5">
            <Label htmlFor="mobile-brew-visibility">Brew visibility</Label>
            <Select
              id="mobile-brew-visibility"
              name="visibility"
              defaultValue={brewLog?.visibility ?? defaultVisibility}
            >
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 5}>
        <Card>
          <CardTitle>Save brew log</CardTitle>
          <div className="mt-5 grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-4">
            <p className="text-sm font-semibold">
              {selectedRecipe ? selectedRecipe.title : (selectedCoffee?.name ?? "Free brew")}
            </p>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Defaults are filled from the selected recipe, including{" "}
              {selectedRecipe ? formatDuration(selectedRecipe.totalTimeSeconds) : "your entered"}{" "}
              brew time.
            </p>
          </div>
        </Card>
      </WizardPanel>

      <div className="sticky bottom-[84px] z-20 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#10100f]/95 p-3 shadow-2xl backdrop-blur">
        <Button
          type="button"
          variant="secondary"
          onClick={goBack}
          disabled={isFirstStep}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
        >
          Back
        </Button>
        <div className="flex gap-2">
          {isLastStep ? (
            <Button type="submit" icon={<Check className="h-4 w-4" aria-hidden />}>
              {submitLabel}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              icon={<ArrowRight className="h-4 w-4" aria-hidden />}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  value,
  optional = false
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  optional?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="number"
        step="any"
        defaultValue={value}
        placeholder={optional ? "Optional" : undefined}
      />
    </div>
  );
}

function WizardPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <section className={cn("min-h-[440px]", !active && "hidden")} aria-hidden={!active}>
      {children}
    </section>
  );
}
