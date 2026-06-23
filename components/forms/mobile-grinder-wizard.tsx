"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  ImagePlus,
  Settings2,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import type { GearItem, Visibility } from "@/lib/domain";
import { cn } from "@/lib/format";

type GrinderDefaults = {
  name?: string;
  brand?: string;
  model?: string;
  grinderDrive?: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  notes?: string;
  imageUrl?: string;
};

const methods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];

const wizardSteps = [
  { title: "Photo", icon: ImagePlus },
  { title: "Identity", icon: Sparkles },
  { title: "Burrs", icon: Settings2 },
  { title: "Ranges", icon: SlidersHorizontal },
  { title: "Visibility", icon: Eye }
];

export function MobileGrinderWizard({
  gear,
  defaults,
  action,
  defaultVisibility = "private",
  submitLabel = "Save grinder"
}: {
  gear?: GearItem;
  defaults?: GrinderDefaults;
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
    <form action={action} noValidate className="mt-5 grid gap-4 lg:hidden">
      {gear ? <input type="hidden" name="id" value={gear.id} /> : null}
      <input type="hidden" name="type" value="grinder" />

      <div className="sticky top-3 z-10 grid gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[#10100f]/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Grinder</p>
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
          aria-label="Grinder wizard steps"
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
      </div>

      <WizardPanel active={stepIndex === 0}>
        <Panel title="Photo">
          <MediaUploadField
            entityType="gear"
            label="Add grinder photo"
            urlFieldName="imageUrl"
            initialUrl={gear?.imageUrl ?? defaults?.imageUrl}
          />
        </Panel>
      </WizardPanel>

      <WizardPanel active={stepIndex === 1}>
        <Panel title="Brand / model">
          <div className="grid gap-4">
            <Field
              id="mobile-grinder-name"
              name="name"
              label="Grinder name"
              placeholder="Comandante C40"
              defaultValue={gear?.name ?? defaults?.name}
            />
            <Field
              id="mobile-grinder-brand"
              name="brand"
              label="Grinder brand"
              placeholder="Comandante"
              defaultValue={gear?.brand ?? defaults?.brand}
            />
            <Field
              id="mobile-grinder-model"
              name="model"
              label="Grinder model"
              placeholder="C40 MK4"
              defaultValue={gear?.model ?? defaults?.model}
            />
          </div>
        </Panel>
      </WizardPanel>

      <WizardPanel active={stepIndex === 2}>
        <Panel title="Type / burrs">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="mobile-grinder-drive">Grinder drive</Label>
              <Select
                id="mobile-grinder-drive"
                name="grinderDrive"
                defaultValue={defaults?.grinderDrive ?? "manual"}
              >
                <option value="manual">Manual</option>
                <option value="electric">Electric</option>
              </Select>
            </div>
            <Field
              id="mobile-grinder-burrType"
              name="burrType"
              label="Grinder burr type"
              placeholder="Stainless steel conical burrs"
              defaultValue={defaults?.burrType}
            />
          </div>
        </Panel>
      </WizardPanel>

      <WizardPanel active={stepIndex === 3}>
        <Panel title="Settings ranges">
          <div className="grid gap-4">
            <Field
              id="mobile-grinder-filterRange"
              name="filterRange"
              label="Grinder filter range"
              placeholder="40-45 clicks"
              defaultValue={defaults?.filterRange}
            />
            <div>
              <Label htmlFor="mobile-grinder-notes">Grinder notes</Label>
              <Textarea
                id="mobile-grinder-notes"
                name="notes"
                placeholder="Zero point, espresso range, seasoning notes."
                defaultValue={gear?.notes ?? defaults?.notes}
              />
            </div>
            <div>
              <Label htmlFor="mobile-grinder-defaultForMethod">Default brew method</Label>
              <Select
                id="mobile-grinder-defaultForMethod"
                name="defaultForMethod"
                defaultValue={gear?.defaultForMethod ?? ""}
              >
                <option value="">Not default</option>
                {methods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Panel>
      </WizardPanel>

      <WizardPanel active={stepIndex === 4}>
        <Panel title="Visibility">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="mobile-grinder-visibility">Grinder visibility</Label>
              <Select
                id="mobile-grinder-visibility"
                name="visibility"
                defaultValue={gear?.visibility ?? defaultVisibility}
              >
                <option value="private">Private</option>
                <option value="followers">Followers</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </Select>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-4">
              <p className="text-sm font-semibold">
                {gear?.name ?? defaults?.name ?? "Ready to save this grinder."}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Marking a default method makes this grinder appear preselected in recipe and brew
                flows.
              </p>
            </div>
          </div>
        </Panel>
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.04] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  defaultValue
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} placeholder={placeholder} defaultValue={defaultValue} />
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
