import { Clock, Droplets, Thermometer, Timer } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  exportFonts,
  formats,
  themes,
  type ExportBlockId,
  type ExportFontId,
  type ExportFormat,
  type ExportTheme,
  type ExportThemeId
} from "@/components/export/export-options";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

const defaultBlockOrder: ExportBlockId[] = ["hero", "specs", "steps", "notes", "footer"];

export function ExportPreview({
  recipe,
  format = formats[0],
  themeId = themes[0].id,
  overlayStrength = 65,
  textScale = 100,
  imageZoom = 100,
  cardOpacity = 78,
  cardRadius = 8,
  fontId = exportFonts[0].id,
  enabledBlockIds = ["hero", "specs", "steps", "footer"],
  blockOrder = defaultBlockOrder,
  compact = false
}: {
  recipe: Recipe;
  format?: ExportFormat;
  themeId?: ExportThemeId;
  overlayStrength?: number;
  textScale?: number;
  imageZoom?: number;
  cardOpacity?: number;
  cardRadius?: number;
  fontId?: ExportFontId;
  enabledBlockIds?: ExportBlockId[];
  blockOrder?: ExportBlockId[];
  compact?: boolean;
}) {
  const isTall = format.height > format.width;
  const previewHeight = compact ? 260 : isTall ? 720 : 560;
  const aspectRatio = `${format.width} / ${format.height}`;
  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const font = exportFonts.find((item) => item.id === fontId) ?? exportFonts[0];
  const overlayOpacity = overlayStrength / 100;
  const activeBlocks = blockOrder.filter((blockId) => enabledBlockIds.includes(blockId));

  return (
    <div className="grid place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-black/20 p-4">
      <div
        className="relative w-full max-w-[680px] overflow-hidden border bg-[#11140f] p-5 shadow-2xl"
        style={{
          aspectRatio,
          minHeight: previewHeight,
          maxHeight: compact ? 320 : 760,
          borderRadius: cardRadius,
          borderColor: theme.accent,
          backgroundColor: format.transparent
            ? `rgb(17 20 15 / ${cardOpacity / 100})`
            : theme.background,
          color: theme.text
        }}
      >
        {format.transparent ? (
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0] [background-size:16px_16px]" />
        ) : null}
        <Image
          src={recipe.coverUrl}
          alt=""
          fill
          priority={!compact}
          sizes="640px"
          className="object-cover"
          style={{
            opacity: format.transparent ? 0 : 1,
            transform: `scale(${imageZoom / 100})`
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30"
          style={{ opacity: format.transparent ? 0 : overlayOpacity }}
        />
        <div
          className="relative z-10 flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-sm)] border border-white/10 p-4"
          style={{
            background: surfaceWithOpacity(theme.surface, cardOpacity / 100),
            borderRadius: cardRadius,
            fontFamily: font.body
          }}
        >
          {activeBlocks.map((blockId) => (
            <PreviewBlock
              key={blockId}
              blockId={blockId}
              recipe={recipe}
              theme={theme}
              font={font}
              textScale={textScale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({
  blockId,
  recipe,
  theme,
  font,
  textScale
}: {
  blockId: ExportBlockId;
  recipe: Recipe;
  theme: ExportTheme;
  font: (typeof exportFonts)[number];
  textScale: number;
}) {
  const titleSize = `${Math.round(52 * (textScale / 100))}px`;

  if (blockId === "hero") {
    return (
      <div>
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.24em]"
          style={{ color: theme.accent }}
        >
          {recipe.method} recipe
        </p>
        <h3
          className="max-w-sm leading-none"
          style={{ fontSize: titleSize, fontFamily: font.heading }}
        >
          {recipe.title}
        </h3>
        <p
          className="mt-3 max-w-sm text-sm uppercase tracking-[0.22em]"
          style={{ color: theme.muted }}
        >
          {recipe.flavorNotes.slice(0, 3).join(" / ")}
        </p>
      </div>
    );
  }

  if (blockId === "specs") {
    return (
      <div
        className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] p-4 text-sm"
        style={{ background: theme.surface }}
      >
        <PreviewMetric
          icon={<Droplets className="h-4 w-4" />}
          label="Water"
          value={`${recipe.waterGrams}g`}
        />
        <PreviewMetric icon={<CoffeeIcon />} label="Coffee" value={`${recipe.doseGrams}g`} />
        <PreviewMetric
          icon={<Timer className="h-4 w-4" />}
          label="Ratio"
          value={formatRatio(recipe.doseGrams, recipe.waterGrams)}
        />
        <PreviewMetric
          icon={<Thermometer className="h-4 w-4" />}
          label="Temp"
          value={`${recipe.temperatureCelsius}C`}
        />
        <PreviewMetric
          icon={<Clock className="h-4 w-4" />}
          label="Time"
          value={formatDuration(recipe.totalTimeSeconds)}
        />
      </div>
    );
  }

  if (blockId === "steps") {
    return (
      <div
        className="grid max-w-sm gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-3 text-xs"
        style={{ background: theme.surface, color: theme.muted }}
      >
        {recipe.steps.slice(0, 3).map((step) => (
          <div key={step.id} className="flex items-center justify-between gap-3">
            <span className="truncate">{step.label}</span>
            <strong style={{ color: theme.text }}>{formatDuration(step.startsAtSeconds)}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (blockId === "notes") {
    return (
      <p className="max-w-lg text-sm leading-6" style={{ color: theme.muted }}>
        {recipe.description}
      </p>
    );
  }

  return (
    <div
      className="mt-auto flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em]"
      style={{ color: theme.muted }}
    >
      <span style={{ color: theme.accent }}>@{recipe.author.handle}</span>
      <span>{recipe.visibility}</span>
    </div>
  );
}

function PreviewMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-2 opacity-75">
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function CoffeeIcon() {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-full border border-current text-[10px]">
      g
    </span>
  );
}

function surfaceWithOpacity(surface: string, opacity: number) {
  const match = surface.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (!match) {
    return surface;
  }

  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
}
