"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExportControls } from "@/components/export/export-controls";
import {
  exportFonts,
  formats,
  themes,
  type ExportBlockId,
  type ExportFontId,
  type ExportFormatId,
  type ExportThemeId
} from "@/components/export/export-options";
import { ExportPreview } from "@/components/export/export-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/form";
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
const defaultBlockOrder = contentBlocks.map((block) => block.id);

type SavedDraft = {
  formatId: ExportFormatId;
  themeId: ExportThemeId;
  overlayStrength: number;
  textScale: number;
  imageZoom: number;
  cardOpacity: number;
  cardRadius: number;
  fontId: ExportFontId;
  enabledBlockIds: ExportBlockId[];
  blockOrder: ExportBlockId[];
};

export function ExportStudio({
  recipe,
  recipes = [recipe]
}: {
  recipe: Recipe;
  recipes?: Recipe[];
}) {
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipe.id);
  const selectedRecipe = useMemo(
    () => recipes.find((item) => item.id === selectedRecipeId) ?? recipe,
    [recipe, recipes, selectedRecipeId]
  );
  const storageKey = `coffee-export-studio:${selectedRecipe.id}`;
  const [formatId, setFormatId] = useState<ExportFormatId>("post");
  const [themeId, setThemeId] = useState<ExportThemeId>(themes[0].id);
  const [overlayStrength, setOverlayStrength] = useState(65);
  const [textScale, setTextScale] = useState(100);
  const [imageZoom, setImageZoom] = useState(100);
  const [cardOpacity, setCardOpacity] = useState(78);
  const [cardRadius, setCardRadius] = useState(8);
  const [fontId, setFontId] = useState<ExportFontId>(exportFonts[0].id);
  const [enabledBlockIds, setEnabledBlockIds] = useState<ExportBlockId[]>(defaultEnabledBlocks);
  const [blockOrder, setBlockOrder] = useState<ExportBlockId[]>(defaultBlockOrder);
  const [draggedBlockId, setDraggedBlockId] = useState<ExportBlockId | null>(null);
  const [status, setStatus] = useState("Ready");

  const selectedFormat = useMemo(
    () => formats.find((format) => format.id === formatId) ?? formats[0],
    [formatId]
  );
  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === themeId) ?? themes[0],
    [themeId]
  );

  const applyDraft = useCallback((draft: Partial<SavedDraft>) => {
    const nextFormatId =
      draft.formatId && formats.some((format) => format.id === draft.formatId)
        ? draft.formatId
        : undefined;
    const nextThemeId =
      draft.themeId && themes.some((theme) => theme.id === draft.themeId)
        ? draft.themeId
        : undefined;
    const nextOverlayStrength =
      typeof draft.overlayStrength === "number" ? clamp(draft.overlayStrength, 35, 85) : undefined;
    const nextTextScale =
      typeof draft.textScale === "number" ? clamp(draft.textScale, 85, 115) : undefined;
    const nextImageZoom =
      typeof draft.imageZoom === "number" ? clamp(draft.imageZoom, 100, 135) : undefined;
    const nextCardOpacity =
      typeof draft.cardOpacity === "number" ? clamp(draft.cardOpacity, 35, 92) : undefined;
    const nextCardRadius =
      typeof draft.cardRadius === "number" ? clamp(draft.cardRadius, 0, 28) : undefined;
    const nextFontId =
      draft.fontId && exportFonts.some((font) => font.id === draft.fontId)
        ? draft.fontId
        : undefined;
    const nextBlockIds = Array.isArray(draft.enabledBlockIds)
      ? draft.enabledBlockIds.filter((id): id is ExportBlockId =>
          contentBlocks.some((block) => block.id === id)
        )
      : [];
    const nextBlockOrder = normalizeBlockOrder(draft.blockOrder);

    if (nextFormatId) setFormatId(nextFormatId);
    if (nextThemeId) setThemeId(nextThemeId);
    if (nextOverlayStrength) setOverlayStrength(nextOverlayStrength);
    if (nextTextScale) setTextScale(nextTextScale);
    if (nextImageZoom) setImageZoom(nextImageZoom);
    if (nextCardOpacity) setCardOpacity(nextCardOpacity);
    if (nextCardRadius !== undefined) setCardRadius(nextCardRadius);
    if (nextFontId) setFontId(nextFontId);
    if (nextBlockIds.length > 0) setEnabledBlockIds(nextBlockIds);
    if (nextBlockOrder) setBlockOrder(nextBlockOrder);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved) as Partial<SavedDraft>;
      window.queueMicrotask(() => {
        applyDraft(draft);
        setStatus("Draft restored");
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [applyDraft, storageKey]);

  function serializeDraft(): SavedDraft {
    return {
      formatId,
      themeId,
      overlayStrength,
      textScale,
      imageZoom,
      cardOpacity,
      cardRadius,
      fontId,
      enabledBlockIds,
      blockOrder
    };
  }

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
    window.localStorage.setItem(storageKey, JSON.stringify(serializeDraft()));
    setStatus("Draft saved");
  }

  function savePreset() {
    window.localStorage.setItem("coffee-export-studio:preset", JSON.stringify(serializeDraft()));
    setStatus("Preset saved");
  }

  function loadPreset() {
    const preset = window.localStorage.getItem("coffee-export-studio:preset");
    if (!preset) {
      setStatus("No preset saved");
      return;
    }

    try {
      applyDraft(JSON.parse(preset) as Partial<SavedDraft>);
      setStatus("Preset applied");
    } catch {
      window.localStorage.removeItem("coffee-export-studio:preset");
      setStatus("Preset reset");
    }
  }

  function resetDraft() {
    window.localStorage.removeItem(storageKey);
    setFormatId("post");
    setThemeId(themes[0].id);
    setOverlayStrength(65);
    setTextScale(100);
    setImageZoom(100);
    setCardOpacity(78);
    setCardRadius(8);
    setFontId(exportFonts[0].id);
    setEnabledBlockIds(defaultEnabledBlocks);
    setBlockOrder(defaultBlockOrder);
    setStatus("Reset");
  }

  function handleFormatChange(nextFormatId: ExportFormatId) {
    setFormatId(nextFormatId);
    setStatus("Unsaved changes");
  }

  function handleThemeChange(nextThemeId: ExportThemeId) {
    setThemeId(nextThemeId);
    setStatus("Unsaved changes");
  }

  function handleOverlayChange(value: number) {
    setOverlayStrength(value);
    setStatus("Unsaved changes");
  }

  function handleTextScaleChange(value: number) {
    setTextScale(value);
    setStatus("Unsaved changes");
  }

  function handleImageZoomChange(value: number) {
    setImageZoom(value);
    setStatus("Unsaved changes");
  }

  function handleCardOpacityChange(value: number) {
    setCardOpacity(value);
    setStatus("Unsaved changes");
  }

  function handleCardRadiusChange(value: number) {
    setCardRadius(value);
    setStatus("Unsaved changes");
  }

  function handleFontChange(nextFontId: ExportFontId) {
    setFontId(nextFontId);
    setStatus("Unsaved changes");
  }

  function moveBlock(blockId: ExportBlockId, direction: -1 | 1) {
    setBlockOrder((current) => {
      const index = current.indexOf(blockId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setStatus("Unsaved changes");
  }

  function moveBlockTo(blockId: ExportBlockId, targetBlockId: ExportBlockId) {
    if (blockId === targetBlockId) {
      return;
    }

    setBlockOrder((current) => {
      const withoutDragged = current.filter((id) => id !== blockId);
      const targetIndex = withoutDragged.indexOf(targetBlockId);
      if (targetIndex < 0) {
        return current;
      }

      const next = [...withoutDragged];
      next.splice(targetIndex, 0, blockId);
      return next;
    });
    setStatus("Unsaved changes");
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <section className="grid min-w-0 content-start gap-5">
        <div>
          <h1 className="text-3xl font-bold">Export Studio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Build beautiful recipe cards and share your brews.
          </p>
        </div>
        <Card>
          <CardTitle>Workflow</CardTitle>
          <div className="mt-4 grid gap-3">
            {[
              ["1", "Recipe", selectedRecipe.title],
              ["2", "Customize", `${enabledBlockIds.length} blocks shown`],
              ["3", "Format", selectedFormat.label]
            ].map(([step, title, sub]) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-black">
                  {step}
                </span>
                <span>
                  <strong className="block text-sm">{title}</strong>
                  <span className="text-xs text-[var(--text-dim)]">{sub}</span>
                </span>
              </div>
            ))}
          </div>
          {recipes.length > 1 ? (
            <div className="mt-4">
              <Label htmlFor="exportRecipe">Recipe</Label>
              <Select
                id="exportRecipe"
                value={selectedRecipe.id}
                onChange={(event) => {
                  setSelectedRecipeId(event.currentTarget.value);
                  setStatus("Recipe changed");
                }}
              >
                {recipes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </Card>
        <Card>
          <CardTitle>Content blocks</CardTitle>
          <div className="mt-4 grid gap-3">
            {blockOrder.map((blockId, index) => {
              const block = contentBlocks.find((item) => item.id === blockId);
              if (!block) return null;

              return (
                <div
                  key={block.id}
                  data-testid={`export-block-${block.id}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", block.id);
                    setDraggedBlockId(block.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const draggedId = event.dataTransfer.getData("text/plain") as ExportBlockId;
                    moveBlockTo(draggedId || draggedBlockId || block.id, block.id);
                    setDraggedBlockId(null);
                  }}
                  onDragEnd={() => setDraggedBlockId(null)}
                  className={cn(
                    "grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] p-3 transition",
                    draggedBlockId === block.id
                      ? "border-[var(--accent)] bg-white/10"
                      : "bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <GripVertical
                        className="h-4 w-4 shrink-0 cursor-grab text-[var(--text-dim)]"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <strong className="block text-sm">{block.label}</strong>
                        <span className="block truncate text-xs text-[var(--text-dim)]">
                          {block.detail}
                        </span>
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      aria-label={`Show ${block.label}`}
                      checked={enabledBlockIds.includes(block.id)}
                      className="accent-[var(--accent)]"
                      onChange={() => toggleBlock(block.id)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--text-dim)]">Position {index + 1}</span>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        className="focus-ring grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-white/5 text-[var(--text-muted)] disabled:opacity-35"
                        aria-label={`Move ${block.label} up`}
                        disabled={index === 0}
                        onClick={() => moveBlock(block.id, -1)}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="focus-ring grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-white/5 text-[var(--text-muted)] disabled:opacity-35"
                        aria-label={`Move ${block.label} down`}
                        disabled={index === blockOrder.length - 1}
                        onClick={() => moveBlock(block.id, 1)}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 content-start gap-5">
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-none"
            role="tablist"
            aria-label="Export format preview"
          >
            {formats.map((format) => (
              <button
                key={format.id}
                type="button"
                role="tab"
                aria-selected={format.id === formatId}
                className={cn(
                  "focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition",
                  format.id === formatId
                    ? "border-[var(--accent)] text-black"
                    : "border-[var(--border)] bg-white/5 text-[var(--text-muted)] hover:text-[var(--text)]"
                )}
                style={
                  format.id === formatId ? { backgroundColor: selectedTheme.accent } : undefined
                }
                onClick={() => handleFormatChange(format.id)}
              >
                {format.shortLabel}
              </button>
            ))}
          </div>
          <Badge>{status}</Badge>
        </div>
        <ExportPreview
          recipe={selectedRecipe}
          format={selectedFormat}
          themeId={themeId}
          overlayStrength={overlayStrength}
          textScale={textScale}
          imageZoom={imageZoom}
          cardOpacity={cardOpacity}
          cardRadius={cardRadius}
          fontId={fontId}
          enabledBlockIds={enabledBlockIds}
          blockOrder={blockOrder}
        />
      </section>

      <aside className="grid min-w-0 content-start gap-5">
        <ExportControls
          recipe={selectedRecipe}
          formatId={formatId}
          themeId={themeId}
          overlayStrength={overlayStrength}
          textScale={textScale}
          imageZoom={imageZoom}
          cardOpacity={cardOpacity}
          cardRadius={cardRadius}
          fontId={fontId}
          enabledBlockIds={enabledBlockIds}
          blockOrder={blockOrder}
          onFormatChange={handleFormatChange}
          onThemeChange={handleThemeChange}
          onOverlayChange={handleOverlayChange}
          onTextScaleChange={handleTextScaleChange}
          onImageZoomChange={handleImageZoomChange}
          onCardOpacityChange={handleCardOpacityChange}
          onCardRadiusChange={handleCardRadiusChange}
          onFontChange={handleFontChange}
          onSaveDraft={saveDraft}
          onSavePreset={savePreset}
          onLoadPreset={loadPreset}
          onResetDraft={resetDraft}
        />
      </aside>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeBlockOrder(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const knownIds = new Set(contentBlocks.map((block) => block.id));
  const orderedIds = value.filter(
    (id): id is ExportBlockId => typeof id === "string" && knownIds.has(id as ExportBlockId)
  );
  const missingIds = defaultBlockOrder.filter((id) => !orderedIds.includes(id));

  return [...orderedIds, ...missingIds];
}
