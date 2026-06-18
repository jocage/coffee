"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Download, GripVertical, Image as ImageIcon, Palette, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExportControls } from "@/components/export/export-controls";
import { accents, formats, type ExportBlockId, type ExportFormatId } from "@/components/export/export-options";
import { ExportPreview } from "@/components/export/export-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/lib/domain";
import { cn } from "@/lib/format";

const contentBlocks: Array<{ id: ExportBlockId; label: string; detail: string }> = [
  { id: "hero", label: "Hero", detail: "Recipe title and flavor notes" },
  { id: "specs", label: "Brew Specs", detail: "Dose, water, ratio and temp" },
  { id: "steps", label: "Pouring Steps", detail: "First three timed steps" },
  { id: "notes", label: "Notes", detail: "Recipe description" },
  { id: "footer", label: "Footer", detail: "Author and visibility" }
];

const defaultEnabledBlocks: ExportBlockId[] = ["hero", "specs", "steps", "footer"];
const mobileSteps = ["Select", "Format", "Style", "Blocks", "Preview", "Share"] as const;

type SavedDraft = {
  formatId: ExportFormatId;
  accent: string;
  enabledBlockIds: ExportBlockId[];
};

export function ExportStudio({ recipe }: { recipe: Recipe }) {
  const storageKey = `coffee-export-studio:${recipe.id}`;
  const [formatId, setFormatId] = useState<ExportFormatId>("post");
  const [accent, setAccent] = useState(accents[0]);
  const [enabledBlockIds, setEnabledBlockIds] = useState<ExportBlockId[]>(defaultEnabledBlocks);
  const [status, setStatus] = useState("Ready");
  const [mobileStepIndex, setMobileStepIndex] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved) as Partial<SavedDraft>;
      const nextFormatId = draft.formatId && formats.some((format) => format.id === draft.formatId) ? draft.formatId : undefined;
      const nextAccent = draft.accent && accents.includes(draft.accent) ? draft.accent : undefined;
      const nextBlockIds = Array.isArray(draft.enabledBlockIds)
        ? draft.enabledBlockIds.filter((id): id is ExportBlockId => contentBlocks.some((block) => block.id === id))
        : [];

      window.queueMicrotask(() => {
        if (nextFormatId) setFormatId(nextFormatId);
        if (nextAccent) setAccent(nextAccent);
        if (nextBlockIds.length > 0) setEnabledBlockIds(nextBlockIds);
        setStatus("Draft restored");
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const selectedFormat = useMemo(() => formats.find((format) => format.id === formatId) ?? formats[0], [formatId]);
  const mobileStep = mobileSteps[mobileStepIndex];

  function toggleBlock(blockId: ExportBlockId) {
    setEnabledBlockIds((current) => {
      if (current.includes(blockId)) {
        return current.length === 1 ? current : current.filter((id) => id !== blockId);
      }

      return [...current, blockId];
    });
    setStatus("Unsaved changes");
  }

  function saveDraft() {
    window.localStorage.setItem(storageKey, JSON.stringify({ formatId, accent, enabledBlockIds }));
    setStatus("Draft saved");
  }

  function savePreset() {
    window.localStorage.setItem("coffee-export-studio:preset", JSON.stringify({ formatId, accent, enabledBlockIds }));
    setStatus("Preset saved");
  }

  function handleFormatChange(nextFormatId: ExportFormatId) {
    setFormatId(nextFormatId);
    setStatus("Unsaved changes");
  }

  function handleAccentChange(nextAccent: string) {
    setAccent(nextAccent);
    setStatus("Unsaved changes");
  }

  return (
    <>
      <div className="mx-auto hidden w-full max-w-7xl gap-5 px-4 py-5 md:px-6 xl:grid xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        <section className="grid min-w-0 content-start gap-5">
          <div>
            <h1 className="text-3xl font-bold">Export Studio</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Build beautiful recipe cards and share your brews.</p>
          </div>
          <WorkflowCard recipeTitle={recipe.title} blockCount={enabledBlockIds.length} formatLabel={selectedFormat.label} />
          <Card>
            <CardTitle>Content blocks</CardTitle>
            <BlockToggles enabledBlockIds={enabledBlockIds} onToggleBlock={toggleBlock} />
          </Card>
        </section>

        <section className="grid min-w-0 content-start gap-5">
          <div className="flex items-center justify-between gap-3">
            <FormatTabs formatId={formatId} onFormatChange={handleFormatChange} />
            <Badge>{status}</Badge>
          </div>
          <ExportPreview recipe={recipe} format={selectedFormat} accent={accent} enabledBlockIds={enabledBlockIds} />
        </section>

        <aside className="grid min-w-0 content-start gap-5">
          <ExportControls
            recipe={recipe}
            formatId={formatId}
            accent={accent}
            enabledBlockIds={enabledBlockIds}
            onFormatChange={handleFormatChange}
            onAccentChange={handleAccentChange}
            onSaveDraft={saveDraft}
            onSavePreset={savePreset}
          />
        </aside>
      </div>

      <div className="mx-auto grid w-full max-w-xl gap-5 overflow-x-hidden px-4 py-5 xl:hidden">
        <div>
          <h1 className="text-3xl font-bold">Export Studio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Build beautiful recipe cards and share your brews.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Mobile export steps">
          {mobileSteps.map((step, index) => (
            <button
              key={step}
              type="button"
              role="tab"
              aria-selected={index === mobileStepIndex}
              className={cn(
                "focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition",
                index === mobileStepIndex
                  ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                  : "border-[var(--border)] bg-white/5 text-[var(--text-muted)]"
              )}
              onClick={() => setMobileStepIndex(index)}
            >
              {index < mobileStepIndex ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}
              {step}
            </button>
          ))}
        </div>

        <Card className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <CardTitle>{mobileStep}</CardTitle>
            <Badge>{status}</Badge>
          </div>

          {mobileStep === "Select" ? <WorkflowCard recipeTitle={recipe.title} blockCount={enabledBlockIds.length} formatLabel={selectedFormat.label} compact /> : null}
          {mobileStep === "Format" ? <FormatChoices formatId={formatId} onFormatChange={handleFormatChange} /> : null}
          {mobileStep === "Style" ? <AccentPicker accent={accent} onAccentChange={handleAccentChange} onSavePreset={savePreset} /> : null}
          {mobileStep === "Blocks" ? <BlockToggles enabledBlockIds={enabledBlockIds} onToggleBlock={toggleBlock} /> : null}
          {mobileStep === "Preview" ? <ExportPreview recipe={recipe} format={selectedFormat} accent={accent} enabledBlockIds={enabledBlockIds} compact /> : null}
          {mobileStep === "Share" ? (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Export the current {selectedFormat.shortLabel.toLowerCase()} card or save this setup for later.
              </p>
              <ExportControls
                recipe={recipe}
                formatId={formatId}
                accent={accent}
                enabledBlockIds={enabledBlockIds}
                onFormatChange={handleFormatChange}
                onAccentChange={handleAccentChange}
                onSaveDraft={saveDraft}
                onSavePreset={savePreset}
                showCustomization={false}
              />
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<ChevronLeft className="h-4 w-4" aria-hidden />}
            disabled={mobileStepIndex === 0}
            onClick={() => setMobileStepIndex((index) => Math.max(0, index - 1))}
          >
            Back
          </Button>
          <Button
            type="button"
            icon={<ChevronRight className="h-4 w-4" aria-hidden />}
            disabled={mobileStepIndex === mobileSteps.length - 1}
            onClick={() => setMobileStepIndex((index) => Math.min(mobileSteps.length - 1, index + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}

function WorkflowCard({
  recipeTitle,
  blockCount,
  formatLabel,
  compact = false
}: {
  recipeTitle: string;
  blockCount: number;
  formatLabel: string;
  compact?: boolean;
}) {
  const content = (
    <div className={cn("grid gap-3", compact ? "" : "mt-4")}>
      {[
        ["1", "Recipe", recipeTitle],
        ["2", "Customize", `${blockCount} blocks shown`],
        ["3", "Format", formatLabel]
      ].map(([step, title, sub]) => (
        <div key={step} className="flex min-w-0 items-center gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-black">{step}</span>
          <span className="min-w-0">
            <strong className="block text-sm">{title}</strong>
            <span className="block truncate text-xs text-[var(--text-dim)]">{sub}</span>
          </span>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardTitle>Workflow</CardTitle>
      {content}
    </Card>
  );
}

function FormatTabs({
  formatId,
  onFormatChange
}: {
  formatId: ExportFormatId;
  onFormatChange: (formatId: ExportFormatId) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none" role="tablist" aria-label="Export format preview">
      {formats.map((format) => (
        <button
          key={format.id}
          type="button"
          role="tab"
          aria-selected={format.id === formatId}
          className={cn(
            "focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition",
            format.id === formatId
              ? "border-[var(--accent)] bg-[var(--accent)] text-black"
              : "border-[var(--border)] bg-white/5 text-[var(--text-muted)] hover:text-[var(--text)]"
          )}
          onClick={() => onFormatChange(format.id)}
        >
          {format.shortLabel}
        </button>
      ))}
    </div>
  );
}

function FormatChoices({
  formatId,
  onFormatChange
}: {
  formatId: ExportFormatId;
  onFormatChange: (formatId: ExportFormatId) => void;
}) {
  return (
    <div className="grid gap-3">
      {formats.map((format, index) => {
        const Icon = index === 0 ? Smartphone : index === 1 ? ImageIcon : Download;
        return (
          <label key={format.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
            <span className="flex min-w-0 items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
              <span className="min-w-0">
                <strong className="block text-sm">{format.label}</strong>
                <span className="block truncate text-xs text-[var(--text-dim)]">{format.detail}</span>
              </span>
            </span>
            <input
              type="radio"
              name="mobile-format"
              checked={format.id === formatId}
              className="shrink-0 accent-[var(--accent)]"
              onChange={() => onFormatChange(format.id)}
            />
          </label>
        );
      })}
    </div>
  );
}

function AccentPicker({
  accent,
  onAccentChange,
  onSavePreset
}: {
  accent: string;
  onAccentChange: (accent: string) => void;
  onSavePreset: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3">
        {accents.map((color, index) => (
          <button
            key={color}
            type="button"
            className="focus-ring h-10 w-10 rounded-full border border-[var(--border-strong)] data-[active=true]:ring-2 data-[active=true]:ring-[var(--accent)]"
            style={{ background: color }}
            aria-label={`Accent color ${index + 1}`}
            data-active={color === accent}
            onClick={() => onAccentChange(color)}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        icon={<Palette className="h-4 w-4" aria-hidden />}
        onClick={onSavePreset}
      >
        Save preset
      </Button>
    </div>
  );
}

function BlockToggles({
  enabledBlockIds,
  onToggleBlock
}: {
  enabledBlockIds: ExportBlockId[];
  onToggleBlock: (blockId: ExportBlockId) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {contentBlocks.map((block) => (
        <label key={block.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
          <span className="flex min-w-0 items-center gap-3">
            <GripVertical className="h-4 w-4 shrink-0 text-[var(--text-dim)]" aria-hidden />
            <span className="min-w-0">
              <strong className="block text-sm">{block.label}</strong>
              <span className="block truncate text-xs text-[var(--text-dim)]">{block.detail}</span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabledBlockIds.includes(block.id)}
            className="shrink-0 accent-[var(--accent)]"
            onChange={() => onToggleBlock(block.id)}
          />
        </label>
      ))}
    </div>
  );
}
