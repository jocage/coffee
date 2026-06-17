"use client";

import { ArrowLeft, ArrowRight, Check, Coffee, Eye, ImagePlus, ListChecks, Scale, Settings2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { RecipeStepEditor } from "@/components/forms/recipe-step-editor";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/format";
import type { Recipe, Visibility } from "@/lib/domain";

const methods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];

const wizardSteps = [
  { title: "Basics", icon: Sparkles },
  { title: "Photo", icon: ImagePlus },
  { title: "Parameters", icon: Scale },
  { title: "Gear", icon: Settings2 },
  { title: "Steps", icon: ListChecks },
  { title: "Taste", icon: Coffee },
  { title: "Visibility", icon: Eye },
  { title: "Preview", icon: Check }
];

export function MobileRecipeWizard({
  recipe,
  action,
  defaultVisibility = "private",
  submitLabel = "Save draft"
}: {
  recipe?: Recipe;
  action: (formData: FormData) => Promise<void>;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = wizardSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === wizardSteps.length - 1;
  const progress = useMemo(() => Math.round(((stepIndex + 1) / wizardSteps.length) * 100), [stepIndex]);

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, wizardSteps.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <form action={action} noValidate className="grid gap-4 lg:hidden">
      {recipe ? <input type="hidden" name="id" value={recipe.id} /> : null}

      <Card className="sticky top-3 z-10 grid gap-4 bg-[#10100f]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">New Recipe</p>
            <h2 className="text-lg font-bold">{activeStep.title}</h2>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{stepIndex + 1} / {wizardSteps.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8" aria-hidden>
          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none" aria-label="Recipe wizard steps">
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
          <CardTitle>Basics</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-title">Recipe name</Label>
              <Input id="mobile-title" name="title" placeholder="My new recipe" defaultValue={recipe?.title} required />
            </div>
            <div>
              <Label htmlFor="mobile-subtitle">Subtitle</Label>
              <Input id="mobile-subtitle" name="subtitle" placeholder="Clean, bright, sweet" defaultValue={recipe?.subtitle} />
            </div>
            <div>
              <Label htmlFor="mobile-description">Description</Label>
              <Textarea id="mobile-description" name="description" placeholder="Write about this recipe..." defaultValue={recipe?.description} />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 1}>
        <Card>
          <CardTitle>Photo</CardTitle>
          <div className="mt-5">
            <MediaUploadField
              entityType="recipe"
              label="Add recipe cover"
              urlFieldName="coverUrl"
              assetFieldName="coverAssetId"
              initialUrl={recipe?.coverUrl}
            />
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 2}>
        <Card>
          <CardTitle>Parameters</CardTitle>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="mobile-method">Brew method</Label>
              <Select id="mobile-method" name="method" defaultValue={recipe?.method ?? "V60"}>
                {methods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="mobile-doseGrams">Dose (g)</Label>
              <Input id="mobile-doseGrams" name="doseGrams" type="number" min="1" defaultValue={recipe?.doseGrams ?? 20} required />
            </div>
            <div>
              <Label htmlFor="mobile-waterGrams">Water (g)</Label>
              <Input id="mobile-waterGrams" name="waterGrams" type="number" min="1" defaultValue={recipe?.waterGrams ?? 300} required />
            </div>
            <div>
              <Label htmlFor="mobile-temperatureCelsius">Temp (C)</Label>
              <Input id="mobile-temperatureCelsius" name="temperatureCelsius" type="number" min="50" max="100" defaultValue={recipe?.temperatureCelsius ?? 93} required />
            </div>
            <div>
              <Label htmlFor="mobile-ratio-preview">Ratio</Label>
              <Input id="mobile-ratio-preview" value="Auto" readOnly aria-label="Calculated ratio" />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 3}>
        <Card>
          <CardTitle>Gear</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-grindLabel">Grind profile</Label>
              <Input id="mobile-grindLabel" name="grindLabel" defaultValue={recipe?.grindLabel ?? "Medium-fine"} placeholder="Medium-fine, espresso fine" required />
            </div>
            <div>
              <Label htmlFor="mobile-grindSetting">Setting</Label>
              <Input id="mobile-grindSetting" name="grindSetting" defaultValue={recipe?.grindSetting ?? ""} placeholder="C40 42 clicks, Niche 18" />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 4}>
        <Card>
          <CardTitle>Steps</CardTitle>
          <RecipeStepEditor steps={recipe?.steps} />
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 5}>
        <Card>
          <CardTitle>Taste</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-flavorNotes">Flavor notes</Label>
              <Input id="mobile-flavorNotes" name="flavorNotesPreview" placeholder="Jasmine, peach, bergamot" />
            </div>
            <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3 text-sm leading-6 text-[var(--text-muted)]">
              Flavor notes are captured as descriptive copy for now. Detailed taste scoring can be added after the recipe is saved.
            </p>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 6}>
        <Card>
          <CardTitle>Visibility</CardTitle>
          <div className="mt-5">
            <Label htmlFor="mobile-visibility">Visibility</Label>
            <Select id="mobile-visibility" name="visibility" defaultValue={recipe?.visibility ?? defaultVisibility}>
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Drafts can stay private and be published later from the owner recipe page.</p>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 7}>
        <Card>
          <CardTitle>Preview</CardTitle>
          <div className="mt-5 grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-4">
            <p className="text-sm font-semibold">Ready to save this recipe draft.</p>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Your entered fields stay preserved while moving back and forward through the wizard.
            </p>
          </div>
        </Card>
      </WizardPanel>

      <div className="sticky bottom-[84px] z-20 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#10100f]/95 p-3 shadow-2xl backdrop-blur">
        <Button type="button" variant="secondary" onClick={goBack} disabled={isFirstStep} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="submit" name="intent" value="draft" variant={isLastStep ? "primary" : "secondary"} icon={<Check className="h-4 w-4" aria-hidden />}>
            {submitLabel}
          </Button>
          {!isLastStep ? (
            <Button type="button" onClick={goNext} icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              Continue
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function WizardPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <section className={cn("min-h-[440px]", !active && "hidden")} aria-hidden={!active}>
      {children}
    </section>
  );
}
