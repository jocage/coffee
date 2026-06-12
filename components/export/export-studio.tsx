"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExportControls } from "@/components/export/export-controls";
import { accents, formats, type ExportBlockId, type ExportFormatId } from "@/components/export/export-options";
import { ExportPreview } from "@/components/export/export-preview";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <section className="grid min-w-0 content-start gap-5">
        <div>
          <h1 className="text-3xl font-bold">Export Studio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Build beautiful recipe cards and share your brews.</p>
        </div>
        <Card>
          <CardTitle>Workflow</CardTitle>
          <div className="mt-4 grid gap-3">
            {[
              ["1", "Recipe", recipe.title],
              ["2", "Customize", `${enabledBlockIds.length} blocks shown`],
              ["3", "Format", selectedFormat.label]
            ].map(([step, title, sub]) => (
              <div key={step} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-black">{step}</span>
                <span>
                  <strong className="block text-sm">{title}</strong>
                  <span className="text-xs text-[var(--text-dim)]">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Content blocks</CardTitle>
          <div className="mt-4 grid gap-3">
            {contentBlocks.map((block) => (
              <label key={block.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
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
                  className="accent-[var(--accent)]"
                  onChange={() => toggleBlock(block.id)}
                />
              </label>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 content-start gap-5">
        <div className="flex items-center justify-between gap-3">
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
                onClick={() => handleFormatChange(format.id)}
              >
                {format.shortLabel}
              </button>
            ))}
          </div>
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
  );
}
