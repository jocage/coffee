"use client";

import { ArrowLeft, ArrowRight, Check, Eye, ImagePlus, MapPin, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import type { CoffeeBean, Visibility } from "@/lib/domain";
import { cn } from "@/lib/format";

const wizardSteps = [
  { title: "Photo", icon: ImagePlus },
  { title: "Identity", icon: Sparkles },
  { title: "Place", icon: MapPin },
  { title: "Taste", icon: Star },
  { title: "Visibility", icon: Eye }
];

export function MobileCoffeeWizard({
  coffee,
  action,
  defaultVisibility = "private",
  submitLabel = "Save coffee"
}: {
  coffee?: CoffeeBean;
  action: (formData: FormData) => Promise<void>;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = wizardSteps[stepIndex];
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
      {coffee ? <input type="hidden" name="id" value={coffee.id} /> : null}

      <Card className="sticky top-3 z-10 grid gap-4 bg-[#10100f]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Coffee</p>
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
        <div className="flex gap-2 overflow-x-auto scrollbar-none" aria-label="Coffee wizard steps">
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
          <CardTitle>Photo</CardTitle>
          <div className="mt-5">
            <MediaUploadField
              entityType="coffee"
              label="Add coffee bag photo"
              urlFieldName="imageUrl"
              initialUrl={coffee?.imageUrl}
            />
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 1}>
        <Card>
          <CardTitle>Name / roaster</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-coffee-name">Coffee name</Label>
              <Input
                id="mobile-coffee-name"
                name="name"
                placeholder="Ethiopia Shakiso"
                defaultValue={coffee?.name}
                required
              />
            </div>
            <div>
              <Label htmlFor="mobile-coffee-roaster">Coffee roaster</Label>
              <Input
                id="mobile-coffee-roaster"
                name="roaster"
                placeholder="Kurasa Kyoto"
                defaultValue={coffee?.roaster}
                required
              />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 2}>
        <Card>
          <CardTitle>Origin / process</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-coffee-origin">Coffee origin</Label>
              <Input
                id="mobile-coffee-origin"
                name="origin"
                placeholder="Yirgacheffe, Ethiopia"
                defaultValue={coffee?.origin}
                required
              />
            </div>
            <div>
              <Label htmlFor="mobile-coffee-process">Coffee process</Label>
              <Input
                id="mobile-coffee-process"
                name="process"
                placeholder="Washed"
                defaultValue={coffee?.process}
              />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 3}>
        <Card>
          <CardTitle>Roast / flavor</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-coffee-roastLevel">Coffee roast level</Label>
              <Select
                id="mobile-coffee-roastLevel"
                name="roastLevel"
                defaultValue={coffee?.roastLevel ?? "light"}
              >
                <option value="light">Light</option>
                <option value="medium-light">Medium-light</option>
                <option value="medium">Medium</option>
                <option value="medium-dark">Medium-dark</option>
                <option value="dark">Dark</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="mobile-coffee-rating">Coffee rating</Label>
              <Input
                id="mobile-coffee-rating"
                name="rating"
                placeholder="4.8"
                defaultValue={coffee?.rating ? String(coffee.rating) : undefined}
              />
            </div>
            <div>
              <Label htmlFor="mobile-coffee-flavorNotes">Coffee flavor notes</Label>
              <Textarea
                id="mobile-coffee-flavorNotes"
                name="flavorNotes"
                placeholder="Jasmine, peach, bergamot"
                defaultValue={coffee?.flavorNotes.join(", ")}
              />
            </div>
          </div>
        </Card>
      </WizardPanel>

      <WizardPanel active={stepIndex === 4}>
        <Card>
          <CardTitle>Visibility</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="mobile-coffee-visibility">Coffee visibility</Label>
              <Select
                id="mobile-coffee-visibility"
                name="visibility"
                defaultValue={coffee?.visibility ?? defaultVisibility}
              >
                <option value="private">Private</option>
                <option value="followers">Followers</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </Select>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-4">
              <p className="text-sm font-semibold">
                {coffee?.name ?? "Ready to save this coffee."}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                The bag photo step uses the same upload field as desktop, so mobile browsers can
                open the camera when supported.
              </p>
            </div>
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
